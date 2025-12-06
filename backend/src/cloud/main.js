// Cloud Code for Hearing Clinic System

// Auto-fill fullName before saving Client
Parse.Cloud.beforeSave("Client", async (request) => {
  const client = request.object;
  const firstName = client.get("firstName") || "";
  const lastName = client.get("lastName") || "";
  const fullName = `${lastName} ${firstName}`.trim();
  client.set("fullName", fullName);

  // Set createdBy/updatedBy if not set
  if (!client.get("createdBy") && request.user) {
    client.set("createdBy", request.user);
  }
  if (request.user) {
    client.set("updatedBy", request.user);
  }

  // Set isActive default to true
  if (client.get("isActive") === undefined) {
    client.set("isActive", true);
  }
});

// Validate Client before save
Parse.Cloud.beforeSave("Client", async (request) => {
  const client = request.object;
  
  // Require either fullName OR (firstName AND lastName)
  const fullName = client.get("fullName");
  const firstName = client.get("firstName");
  const lastName = client.get("lastName");
  
  if (!fullName && (!firstName || !lastName)) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, "Full name or first name and last name are required");
  }
  
  // If fullName exists but firstName/lastName don't, try to split fullName
  if (fullName && (!firstName || !lastName)) {
    const nameParts = String(fullName).trim().split(/\s+/);
    if (nameParts.length > 1) {
      client.set("lastName", nameParts[0]);
      client.set("firstName", nameParts.slice(1).join(" "));
    } else {
      client.set("firstName", fullName);
      client.set("lastName", "");
    }
  }
  
  // Ensure fullName exists
  if (!fullName && firstName && lastName) {
    client.set("fullName", `${lastName} ${firstName}`.trim());
  }
  
  // Phone is now optional (can be empty string)
  // Remove the phone validation to allow empty phones
});

// Update client's lastVisitDate after saving HearingReport
Parse.Cloud.afterSave("HearingReport", async (request) => {
  const report = request.object;
  const client = report.get("client");

  if (!client) {
    return;
  }

  try {
    await client.fetch({ useMasterKey: true });
    const testDate = report.get("testDate");
    if (testDate) {
      client.set("lastVisitDate", testDate);
      await client.save(null, { useMasterKey: true });
    }
  } catch (error) {
    console.error("Error updating client lastVisitDate:", error);
  }
});

// Set createdBy/updatedBy and basic validation for HearingReport
Parse.Cloud.beforeSave("HearingReport", async (request) => {
  const report = request.object;

  if (!report.get("createdBy") && request.user) {
    report.set("createdBy", request.user);
  }
  if (request.user) {
    report.set("updatedBy", request.user);
  }

  // Ensure client exists
  let client = report.get("client");

  // If client is a string id, convert to Pointer
  if (typeof client === "string") {
    client = Parse.Object.createWithoutData("Client", client);
    report.set("client", client);
  }

  if (!client) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, "Client is required");
  }

  if (!report.get("testDate")) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, "Test date is required");
  }
});

// Set createdBy/updatedBy for Reminder
Parse.Cloud.beforeSave("Reminder", async (request) => {
  const reminder = request.object;
  
  if (!reminder.get("createdBy") && request.user) {
    reminder.set("createdBy", request.user);
  }
  if (request.user) {
    reminder.set("updatedBy", request.user);
  }

  // Validate required fields
  if (!reminder.get("client")) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, "Client is required");
  }
  
  if (!reminder.get("title")) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, "Title is required");
  }
  
  if (!reminder.get("dueAt")) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, "Due date is required");
  }

  // Auto-set status if not provided
  if (!reminder.get("status")) {
    const dueAt = reminder.get("dueAt");
    const now = new Date();
    if (dueAt < now) {
      reminder.set("status", "overdue");
    } else {
      reminder.set("status", "pending");
    }
  }
});

// Update reminder status based on dueAt date
Parse.Cloud.beforeSave("Reminder", async (request) => {
  const reminder = request.object;
  const dueAt = reminder.get("dueAt");
  const status = reminder.get("status");
  
  if (dueAt && status !== "done") {
    const now = new Date();
    if (dueAt < now) {
      reminder.set("status", "overdue");
    } else {
      reminder.set("status", "pending");
    }
  }
});

// Prevent deleting clients with existing hearing reports (optional - can be made configurable)
Parse.Cloud.beforeDelete("Client", async (request) => {
  const client = request.object;
  
  const HearingReport = Parse.Object.extend("HearingReport");
  const query = new Parse.Query(HearingReport);
  query.equalTo("client", client);
  const count = await query.count({ useMasterKey: true });
  
  if (count > 0) {
    // Instead of throwing error, we can soft delete
    // throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, "Cannot delete client with existing hearing reports");
    // For now, we'll allow deletion but recommend soft delete via isActive flag
  }
});

// Set createdBy/updatedBy for ContactLog
Parse.Cloud.beforeSave("ContactLog", async (request) => {
  const log = request.object;
  
  if (!log.get("createdBy") && request.user) {
    log.set("createdBy", request.user);
  }
  if (request.user) {
    log.set("updatedBy", request.user);
  }
});

// Cloud Function to get staff members (bypasses _User query restrictions)
Parse.Cloud.define("getStaffMembers", async (request) => {
  // Require authentication
  if (!request.user) {
    throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, "Authentication required");
  }

  const params = request.params || {};
  const searchTerm = params.search;
  const roleFilter = params.role;

  // Build query for staff members
  let query = new Parse.Query(Parse.User);
  
  // Only get users with staffRole
  query.exists("staffRole");
  
  // Exclude admin users
  query.notEqualTo("role", "admin");
  
  // Filter by role if provided
  if (roleFilter) {
    query.equalTo("staffRole", roleFilter);
  }
  
  // Search by username, email, or fullName
  if (searchTerm) {
    const search = searchTerm.toLowerCase();
    const usernameQuery = new Parse.Query(Parse.User)
      .exists("staffRole")
      .notEqualTo("role", "admin")
      .contains("username", search);
    
    const emailQuery = new Parse.Query(Parse.User)
      .exists("staffRole")
      .notEqualTo("role", "admin")
      .contains("email", search);
    
    const fullNameQuery = new Parse.Query(Parse.User)
      .exists("staffRole")
      .notEqualTo("role", "admin")
      .contains("fullName", search);
    
    query = Parse.Query.or(usernameQuery, emailQuery, fullNameQuery);
    
    if (roleFilter) {
      query.equalTo("staffRole", roleFilter);
    }
  }
  
  // Sorting
  query.addAscending("username");
  
  // Limit and skip
  if (params.limit) {
    query.limit(params.limit);
  }
  if (params.skip) {
    query.skip(params.skip);
  }
  
  // Execute query with master key to bypass restrictions
  const staff = await query.find({ useMasterKey: true });
  
  // Return user data as JSON - frontend will convert to Parse.User objects
  return staff.map(user => {
    // Get all attributes
    const attrs = user.attributes;
    const userId = user.id || user.objectId;
    return {
      id: userId,
      objectId: userId, // Ensure objectId is set for Parse.User.fromJSON()
      className: user.className,
      ...attrs,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  });
});

// Cloud Function to get staff member by ID (bypasses _User query restrictions)
Parse.Cloud.define("getStaffById", async (request) => {
  // Require authentication
  if (!request.user) {
    throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, "Authentication required");
  }

  const staffId = request.params.id;
  
  if (!staffId) {
    throw new Parse.Error(Parse.Error.INVALID_QUERY, "Staff ID is required");
  }

  // Query for staff member with master key
  const query = new Parse.Query(Parse.User);
  query.equalTo("objectId", staffId);
  
  const staff = await query.first({ useMasterKey: true });
  
  if (!staff) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, "Staff member not found");
  }
  
  // Verify this is a staff member (has staffRole and not admin)
  const staffRole = staff.get("staffRole");
  const role = staff.get("role");
  
  if (!staffRole || role === "admin") {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, "Staff member not found");
  }

  // Return user data as JSON
  const attrs = staff.attributes;
  const userId = staff.id || staff.objectId;
  return {
    objectId: userId, // Ensure objectId is set for Parse.User.fromJSON()
    id: userId,
    className: staff.className,
    ...attrs,
    createdAt: staff.createdAt,
    updatedAt: staff.updatedAt,
  };
});

// Helper function to create a reminder
async function createReminder(data, useMasterKey = true) {
  const Reminder = Parse.Object.extend("Reminder");
  const reminder = new Reminder();
  
  reminder.set("client", data.client);
  reminder.set("title", data.title);
  if (data.description) reminder.set("description", data.description);
  reminder.set("dueAt", data.dueAt);
  reminder.set("status", data.status || "pending");
  if (data.type) reminder.set("type", data.type);
  if (data.priority) reminder.set("priority", data.priority);
  if (data.appointmentId) reminder.set("appointmentId", data.appointmentId);
  if (data.hearingReportId) reminder.set("hearingReportId", data.hearingReportId);
  if (data.isAutoGenerated !== undefined) reminder.set("isAutoGenerated", data.isAutoGenerated);
  if (data.autoRecurring !== undefined) reminder.set("autoRecurring", data.autoRecurring);
  if (data.recurringInterval) reminder.set("recurringInterval", data.recurringInterval);
  if (data.createdBy) reminder.set("createdBy", data.createdBy);
  if (data.updatedBy) reminder.set("updatedBy", data.updatedBy);
  
  const saveOptions = useMasterKey ? { useMasterKey: true } : {};
  return await reminder.save(null, saveOptions);
}

// Generate unique repair code for REPAIR appointments
Parse.Cloud.beforeSave("Appointment", async (request) => {
  const appointment = request.object;
  const appointmentType = appointment.get("type");
  
  // Only generate code for REPAIR appointments
  if (appointmentType === "REPAIR") {
    // If repairCode already exists (editing), keep it
    if (appointment.get("repairCode")) {
      return;
    }
    
    // Generate unique 8-digit code
    let repairCode = "";
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      // Generate random 8-digit number
      repairCode = Math.floor(10000000 + Math.random() * 90000000).toString();
      
      // Check if code already exists
      const Appointment = Parse.Object.extend("Appointment");
      const query = new Parse.Query(Appointment);
      query.equalTo("repairCode", repairCode);
      query.equalTo("type", "REPAIR");
      
      const existing = await query.first({ useMasterKey: true });
      
      if (!existing) {
        isUnique = true;
      }
      
      attempts++;
    }
    
    if (isUnique) {
      appointment.set("repairCode", repairCode);
    } else {
      // Fallback: use timestamp-based code if random generation fails
      const timestamp = Date.now().toString().slice(-8);
      appointment.set("repairCode", timestamp);
    }
  }
  
  // Set createdBy/updatedBy if not set
  if (!appointment.get("createdBy") && request.user) {
    appointment.set("createdBy", request.user);
  }
  if (request.user) {
    appointment.set("updatedBy", request.user);
  }
});

// Auto-create reminders after saving Appointment
Parse.Cloud.afterSave("Appointment", async (request) => {
  const appointment = request.object;
  const appointmentType = appointment.get("type");
  const status = appointment.get("status");
  const appointmentDate = appointment.get("date");
  const client = appointment.get("client");
  const createdBy = appointment.get("createdBy") || request.user;

  // Only create reminders for COMPLETED appointments
  if (status !== "COMPLETED" || !client || !appointmentDate) {
    return;
  }

  try {
    const Reminder = Parse.Object.extend("Reminder");
    const apptDate = new Date(appointmentDate);
    const clientId = typeof client === "object" ? client.id : client;
    
    // Fetch client once to get fullName
    let clientObj = client;
    let clientFullName = "";
    if (typeof client === "object" && client.id) {
      try {
        await client.fetch({ useMasterKey: true });
        clientFullName = client.get("fullName") || "";
      } catch (error) {
        console.error("Error fetching client for reminder:", error);
      }
    }
    const clientPointer = Parse.Object.createWithoutData("Client", clientId);

    if (appointmentType === "REPAIR") {
      // 1. Kiểm tra sau sửa (2 tuần)
      const checkupDate = new Date(apptDate);
      checkupDate.setDate(checkupDate.getDate() + 14);
      
      await createReminder({
        client: clientPointer,
        title: `Kiểm tra sau sửa máy - ${clientFullName}`,
        description: `Kiểm tra máy trợ thính sau khi sửa để đảm bảo hoạt động tốt.`,
        dueAt: checkupDate,
        status: "pending",
        type: "POST_REPAIR_CHECK",
        priority: "medium",
        appointmentId: appointment,
        isAutoGenerated: true,
        createdBy: createdBy,
        updatedBy: createdBy,
      }, true);

      // 2. Bảo trì định kỳ (6 tháng)
      const maintenanceDate = new Date(apptDate);
      maintenanceDate.setMonth(maintenanceDate.getMonth() + 6);
      
      await createReminder({
        client: clientPointer,
        title: `Bảo trì định kỳ máy trợ thính - ${clientFullName}`,
        description: `Nhắc nhở bảo trì định kỳ máy trợ thính sau 6 tháng.`,
        dueAt: maintenanceDate,
        status: "pending",
        type: "MAINTENANCE_DUE",
        priority: "medium",
        appointmentId: appointment,
        isAutoGenerated: true,
        autoRecurring: true,
        recurringInterval: 180, // 6 tháng
        createdBy: createdBy,
        updatedBy: createdBy,
      }, true);

    } else if (appointmentType === "PURCHASE") {
      // Hỗ trợ sau mua: 1 tuần, 1 tháng, 3 tháng
      const intervals = [
        { days: 7, title: "Hỗ trợ sau mua (1 tuần)", description: "Liên hệ khách hàng sau 1 tuần để hỗ trợ và điều chỉnh máy trợ thính." },
        { days: 30, title: "Hỗ trợ sau mua (1 tháng)", description: "Theo dõi tình trạng sử dụng máy trợ thính sau 1 tháng." },
        { days: 90, title: "Hỗ trợ sau mua (3 tháng)", description: "Đánh giá hiệu quả sử dụng máy trợ thính sau 3 tháng." },
      ];

      for (const interval of intervals) {
        const dueDate = new Date(apptDate);
        dueDate.setDate(dueDate.getDate() + interval.days);
        
        await createReminder({
          client: clientPointer,
          title: `${interval.title} - ${clientFullName}`,
          description: interval.description,
          dueAt: dueDate,
          status: "pending",
          type: "POST_PURCHASE_SUPPORT",
          priority: interval.days === 7 ? "high" : "medium",
          appointmentId: appointment,
          isAutoGenerated: true,
          createdBy: createdBy,
          updatedBy: createdBy,
        }, true);
      }

    } else if (appointmentType === "AUDIOGRAM") {
      // Đo thính lực định kỳ tiếp theo (6-12 tháng)
      const hearingReport = appointment.get("hearingReport");
      let nextAudiogramDate = new Date(apptDate);
      nextAudiogramDate.setMonth(nextAudiogramDate.getMonth() + 6); // Mặc định 6 tháng
      
      // Có thể điều chỉnh dựa trên recommendations trong hearing report
      if (hearingReport) {
        try {
          await hearingReport.fetch({ useMasterKey: true });
          const recommendations = hearingReport.get("recommendations");
          // Nếu có recommendations nói về 3 tháng, dùng 3 tháng, nếu không dùng 6 tháng
          if (recommendations && recommendations.toLowerCase().includes("3 tháng")) {
            nextAudiogramDate = new Date(apptDate);
            nextAudiogramDate.setMonth(nextAudiogramDate.getMonth() + 3);
          }
        } catch (error) {
          console.error("Error fetching hearing report for reminder:", error);
        }
      }
      
      await createReminder({
        client: clientPointer,
        title: `Đo thính lực định kỳ tiếp theo - ${clientFullName}`,
        description: `Nhắc nhở đo thính lực định kỳ để theo dõi tình trạng thính giác.`,
        dueAt: nextAudiogramDate,
        status: "pending",
        type: "AUDIOGRAM_DUE",
        priority: "high",
        appointmentId: appointment,
        hearingReportId: hearingReport || undefined,
        isAutoGenerated: true,
        autoRecurring: true,
        recurringInterval: 180, // 6 tháng
        createdBy: createdBy,
        updatedBy: createdBy,
      }, true);

    } else if (appointmentType === "COUNSELING") {
      // Tư vấn theo dõi (3-6 tháng)
      const followUpDate = new Date(apptDate);
      followUpDate.setMonth(followUpDate.getMonth() + 3); // Mặc định 3 tháng
      
      await createReminder({
        client: clientPointer,
        title: `Tư vấn theo dõi - ${clientFullName}`,
        description: `Nhắc nhở tư vấn theo dõi để đánh giá tiến trình và hỗ trợ khách hàng.`,
        dueAt: followUpDate,
        status: "pending",
        type: "FOLLOW_UP_COUNSELING",
        priority: "medium",
        appointmentId: appointment,
        isAutoGenerated: true,
        autoRecurring: true,
        recurringInterval: 90, // 3 tháng
        createdBy: createdBy,
        updatedBy: createdBy,
      }, true);
    }

  } catch (error) {
    console.error("Error creating auto-reminders after appointment:", error);
    // Don't throw error to prevent appointment save from failing
  }
});

