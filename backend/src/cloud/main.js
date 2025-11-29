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

// Set createdBy/updatedBy for HearingReport
Parse.Cloud.beforeSave("HearingReport", async (request) => {
  const report = request.object;
  
  if (!report.get("createdBy") && request.user) {
    report.set("createdBy", request.user);
  }
  if (request.user) {
    report.set("updatedBy", request.user);
  }

  // Validate required fields
  if (!report.get("client")) {
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

