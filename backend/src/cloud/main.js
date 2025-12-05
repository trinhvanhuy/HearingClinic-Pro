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
  
  if (!client.get("firstName") || !client.get("lastName")) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, "First name and last name are required");
  }
  
  if (!client.get("phone")) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, "Phone number is required");
  }
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
    return {
      id: user.id,
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
  return {
    objectId: staff.id,
    id: staff.id,
    className: staff.className,
    ...attrs,
    createdAt: staff.createdAt,
    updatedAt: staff.updatedAt,
  };
});

