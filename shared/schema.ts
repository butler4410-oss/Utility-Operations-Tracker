import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users Table
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(), // Admin, Manager, Analyst, ReadOnly
  avatar: text("avatar"),
});

export const insertUserSchema = createInsertSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Clients Table
export const clients = sqliteTable("clients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  utilityType: text("utility_type").notNull(), // Water, Electric, Gas, Multi-Service
  state: text("state").notNull(),
  status: text("status").notNull(), // Active, Onboarding, At-Risk, Inactive
  provider: text("provider").notNull(), // DDSY, DDS, Other
  assignedManager: text("assigned_manager").notNull().references(() => users.id),
  lastActivityDate: text("last_activity_date").notNull(),
  contractStartDate: text("contract_start_date").notNull(),
  tags: text("tags").notNull().default('[]'), // JSON array string
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  createdAt: true
});
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// Activities Table
export const activities = sqliteTable("activities", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }),
  type: text("type").notNull(), // Call Center, Collections, Invoices, etc.
  date: text("date").notNull(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  status: text("status").notNull(), // Open, In Progress, Done, Blocked
  effortHours: text("effort_hours").notNull(),
  outcome: text("outcome"),
  valueScore: integer("value_score").notNull(), // 1-5
  notes: text("notes"),
  attachmentCount: integer("attachment_count").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  createdAt: true
});
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// Client Mail Rules Table (business rules for mail date calculations)
export const clientMailRules = sqliteTable("client_mail_rules", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }).unique(),
  allowedMailDays: text("allowed_mail_days").notNull().default('["Monday","Tuesday","Wednesday","Thursday","Friday"]'), // JSON array string
  blackoutDates: text("blackout_dates").notNull().default('[]'), // JSON array string, YYYY-MM-DD format
  maxSlaBusinessDays: integer("max_sla_business_days").notNull().default(3), // import to mail SLA
  hardDeadlineDay: text("hard_deadline_day"), // e.g., "15" for 15th of month
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertClientMailRuleSchema = createInsertSchema(clientMailRules).omit({
  createdAt: true,
  updatedAt: true
});
export type InsertClientMailRule = z.infer<typeof insertClientMailRuleSchema>;
export type ClientMailRule = typeof clientMailRules.$inferSelect;

// Production Runs Table (replaces generic print jobs)
export const productionRuns = sqliteTable("production_runs", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }),
  importBatchId: text("import_batch_id").notNull(),
  importDateTime: text("import_date_time").notNull(), // ISO string, SLA start time
  targetMailDate: text("target_mail_date").notNull(), // calculated business date
  actualMailDate: text("actual_mail_date"), // when actually mailed
  approvalStatus: text("approval_status").notNull().default('Pending'), // Pending, Approved, Rejected, Unapproved
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: text("approved_at"), // ISO string
  isOnTime: integer("is_on_time"), // 0 = late, 1 = on time, null = not yet mailed
  exceptionReason: text("exception_reason"), // why late or special handling
  targetMailDateOverride: text("target_mail_date_override"), // manual override
  overrideReason: text("override_reason"),
  totalRecords: integer("total_records").notNull().default(0),
  totalPages: integer("total_pages").notNull().default(0),
  totalCost: text("total_cost").notNull().default('0'),
  provider: text("provider").notNull(), // DDSY, DDS, Other
  status: text("status").notNull().default('Imported'), // Imported, QA Review, Approved, Printing, Mailed, Exception
  qaProofUrl: text("qa_proof_url"),
  reportsUrl: text("reports_url"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertProductionRunSchema = createInsertSchema(productionRuns).omit({
  createdAt: true,
  updatedAt: true
});
export type InsertProductionRun = z.infer<typeof insertProductionRunSchema>;
export type ProductionRun = typeof productionRuns.$inferSelect;

// Production Files Table (child records per run)
export const productionFiles = sqliteTable("production_files", {
  id: text("id").primaryKey(),
  productionRunId: text("production_run_id").notNull().references(() => productionRuns.id, { onDelete: 'cascade' }),
  fileId: text("file_id").notNull(),
  dataFileName: text("data_file_name").notNull(),
  documentCode: text("document_code").notNull(), // e.g., BILL, NOTICE, SHUTOFF
  serviceType: text("service_type"), // Water, Electric, Gas
  totalDocuments: integer("total_documents").notNull().default(0),
  totalPages: integer("total_pages").notNull().default(0),
  rejectedCount: integer("rejected_count").notNull().default(0),
  inputFileTotal: integer("input_file_total").notNull().default(0),
  status: text("status").notNull().default('Not Processed'), // Printed, Mailed, Suppressed, Not Processed, Failed
  printedBatchId: text("printed_batch_id"),
  mailedDate: text("mailed_date"),
  suppressionReason: text("suppression_reason"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertProductionFileSchema = createInsertSchema(productionFiles).omit({
  createdAt: true
});
export type InsertProductionFile = z.infer<typeof insertProductionFileSchema>;
export type ProductionFile = typeof productionFiles.$inferSelect;

// Legacy Print Jobs Table (kept for historical data migration)
export const printJobs = sqliteTable("print_jobs", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  clientId: text("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }),
  provider: text("provider").notNull(), // DDSY, DDS, Other
  pieces: integer("pieces").notNull(),
  pages: integer("pages").notNull(),
  cost: text("cost").notNull(),
  status: text("status").notNull(), // Completed, Processing, Failed
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertPrintJobSchema = createInsertSchema(printJobs).omit({
  createdAt: true
});
export type InsertPrintJob = z.infer<typeof insertPrintJobSchema>;
export type PrintJob = typeof printJobs.$inferSelect;

// Surveys Table
export const surveys = sqliteTable("surveys", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  clientId: text("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }),
  type: text("type").notNull(), // NPS, CSAT, Onboarding
  score: integer("score").notNull(), // 0-10
  comments: text("comments"),
  linkedActivityId: text("linked_activity_id").references(() => activities.id),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertSurveySchema = createInsertSchema(surveys).omit({
  createdAt: true
});
export type InsertSurvey = z.infer<typeof insertSurveySchema>;
export type Survey = typeof surveys.$inferSelect;

// Call Records Table (for Call Center tracking)
export const callRecords = sqliteTable("call_records", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }),
  callerName: text("caller_name"),
  callerPhone: text("caller_phone"),
  callerEmail: text("caller_email"),
  contactChannel: text("contact_channel").notNull(), // phone, email, chat
  callReason: text("call_reason").notNull(), // Billing, Technical, Payment, General, Mail Delay
  subcategory: text("subcategory"), // specific subcategories
  priority: text("priority").notNull(), // Low, Medium, High, Urgent
  status: text("status").notNull(), // Open, In Progress, Resolved, Escalated, Callback Scheduled
  summary: text("summary").notNull(),
  detailedNotes: text("detailed_notes"),
  assignedTo: text("assigned_to").references(() => users.id),
  startTime: text("start_time").notNull(), // ISO string
  endTime: text("end_time"), // ISO string
  handleTime: integer("handle_time"), // in seconds
  wrapUpTime: integer("wrap_up_time"), // in seconds
  disposition: text("disposition"), // resolved, escalated, callback_scheduled, billing_dispute, payment_arrangement, other
  resolutionCode: text("resolution_code"),
  resolutionLevel: text("resolution_level"), // Tier 1, Tier 2, Tier 3
  firstContactResolution: integer("first_contact_resolution").notNull().default(0), // 0 = no, 1 = yes
  satisfactionScore: integer("satisfaction_score"), // 1-5 optional quick score
  linkedActivityId: text("linked_activity_id").references(() => activities.id),
  linkedProductionRunId: text("linked_production_run_id").references(() => productionRuns.id), // link to late/exception runs
  escalatedTo: text("escalated_to"), // Collections, Billing, Print, Technical, Implementation
  callbackDate: text("callback_date"), // ISO string
  callbackNotes: text("callback_notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertCallRecordSchema = createInsertSchema(callRecords).omit({
  createdAt: true,
  updatedAt: true
});
export type InsertCallRecord = z.infer<typeof insertCallRecordSchema>;
export type CallRecord = typeof callRecords.$inferSelect;

// JobTrax Jobs Table
export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  jobNumber: text("job_number").notNull().unique(),
  clientId: text("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }),
  description: text("description").notNull(),
  mailPieces: integer("mail_pieces").notNull().default(0),
  startedAt: text("started_at").notNull(), // ISO string
  completedAt: text("completed_at"), // ISO string
  progressPercent: integer("progress_percent").notNull().default(0), // 0-100
  targetMailDate: text("target_mail_date"),
  actualMailDate: text("actual_mail_date"),
  status: text("status").notNull(), // Queued, Imaging, Inserting, Mailstream, Completed, Exception
  linkedProductionRunId: text("linked_production_run_id").references(() => productionRuns.id),
  artifacts: text("artifacts").notNull().default('[]'), // JSON array string with artifact metadata
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  createdAt: true,
  updatedAt: true
});
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

// Message Templates Table (Bill Messages)
export const messageTemplates = sqliteTable("message_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // Commercial, Residential
  folder: text("folder").notNull(),
  isActive: integer("is_active").notNull().default(1), // 0 = inactive, 1 = active
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({
  createdAt: true,
  updatedAt: true
});
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;
export type MessageTemplate = typeof messageTemplates.$inferSelect;

// Bill Messages Table
export const billMessages = sqliteTable("bill_messages", {
  id: text("id").primaryKey(),
  templateId: text("template_id").notNull().references(() => messageTemplates.id, { onDelete: 'cascade' }),
  clientId: text("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }),
  messageText: text("message_text").notNull(),
  alignment: text("alignment").notNull().default('Message Area'), // Message Area, Message Area Centered
  fontFamily: text("font_family").notNull().default('Arial'),
  charLimit: integer("char_limit").notNull().default(500),
  exceedsLimit: integer("exceeds_limit").notNull().default(0), // 0 = within limit, 1 = exceeds
  status: text("status").notNull(), // Draft, Sent to Approver, Approved, Published, Rejected
  createdBy: text("created_by").notNull().references(() => users.id),
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: text("approved_at"), // ISO string
  rejectionReason: text("rejection_reason"),
  publishedAt: text("published_at"), // ISO string
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertBillMessageSchema = createInsertSchema(billMessages).omit({
  createdAt: true,
  updatedAt: true
});
export type InsertBillMessage = z.infer<typeof insertBillMessageSchema>;
export type BillMessage = typeof billMessages.$inferSelect;

// eBill Sends Table
export const eBillSends = sqliteTable("ebill_sends", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }),
  accountNumber: text("account_number").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  billDate: text("bill_date").notNull(),
  sendDate: text("send_date").notNull(), // ISO string
  deliveryStatus: text("delivery_status").notNull(), // Delivered, Bounced, Pending, Failed
  openedAt: text("opened_at"), // ISO string
  billAmount: text("bill_amount").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertEBillSendSchema = createInsertSchema(eBillSends).omit({
  createdAt: true
});
export type InsertEBillSend = z.infer<typeof insertEBillSendSchema>;
export type EBillSend = typeof eBillSends.$inferSelect;

// Recent Activity Events Table (unified event log)
export const recentActivityEvents = sqliteTable("recent_activity_events", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull().$defaultFn(() => new Date().toISOString()),
  eventType: text("event_type").notNull(), // Import, Approve, Reject, Print, Mail, Exception, Hold, Release, Upload, MessageApprove, JobUpdate
  batchId: text("batch_id"), // production run batch or job number
  description: text("description").notNull(),
  userId: text("user_id").references(() => users.id),
  clientId: text("client_id").references(() => clients.id),
  linkedEntityType: text("linked_entity_type"), // ProductionRun, Job, BillMessage, Call
  linkedEntityId: text("linked_entity_id"),
  metadata: text("metadata"), // JSON string for additional context
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertRecentActivityEventSchema = createInsertSchema(recentActivityEvents).omit({
  createdAt: true
});
export type InsertRecentActivityEvent = z.infer<typeof insertRecentActivityEventSchema>;
export type RecentActivityEvent = typeof recentActivityEvents.$inferSelect;

// Confirmation Holds Table (items pending confirmation before proceeding)
export const confirmationHolds = sqliteTable("confirmation_holds", {
  id: text("id").primaryKey(),
  holdType: text("hold_type").notNull(), // QA Review, Client Approval, Payment Hold, Data Verification, Manager Override
  status: text("status").notNull().default('Active'), // Active, Released, Rejected, Expired
  priority: text("priority").notNull().default('Normal'), // Low, Normal, High, Critical
  linkedEntityType: text("linked_entity_type").notNull(), // ProductionRun, Job, BillMessage
  linkedEntityId: text("linked_entity_id").notNull(),
  clientId: text("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }),
  holdReason: text("hold_reason").notNull(),
  holdDetails: text("hold_details"),
  requestedBy: text("requested_by").notNull().references(() => users.id),
  assignedTo: text("assigned_to").references(() => users.id),
  holdStartedAt: text("hold_started_at").notNull().$defaultFn(() => new Date().toISOString()),
  dueDate: text("due_date"), // ISO string
  resolvedAt: text("resolved_at"), // ISO string
  resolvedBy: text("resolved_by").references(() => users.id),
  resolution: text("resolution"), // Released, Rejected, Escalated
  resolutionNotes: text("resolution_notes"),
  affectedRecords: integer("affected_records").notNull().default(0),
  affectedValue: text("affected_value"), // dollar value affected
  escalationCount: integer("escalation_count").notNull().default(0),
  autoReleaseAt: text("auto_release_at"), // ISO string, for time-based auto-release
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertConfirmationHoldSchema = createInsertSchema(confirmationHolds).omit({
  createdAt: true,
  updatedAt: true
});
export type InsertConfirmationHold = z.infer<typeof insertConfirmationHoldSchema>;
export type ConfirmationHold = typeof confirmationHolds.$inferSelect;
