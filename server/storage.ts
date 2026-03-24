import { db } from "./db";
import { hashPassword } from "./auth";
import {
  users, clients, activities, printJobs, surveys, callRecords,
  clientMailRules, productionRuns, productionFiles,
  jobs, messageTemplates, billMessages, eBillSends, recentActivityEvents, confirmationHolds,
  type User, type InsertUser,
  type Client, type InsertClient,
  type Activity, type InsertActivity,
  type PrintJob, type InsertPrintJob,
  type Survey, type InsertSurvey,
  type CallRecord, type InsertCallRecord,
  type ClientMailRule, type InsertClientMailRule,
  type ProductionRun, type InsertProductionRun,
  type ProductionFile, type InsertProductionFile,
  type Job, type InsertJob,
  type MessageTemplate, type InsertMessageTemplate,
  type BillMessage, type InsertBillMessage,
  type EBillSend, type InsertEBillSend,
  type RecentActivityEvent, type InsertRecentActivityEvent,
  type ConfirmationHold, type InsertConfirmationHold
} from "@shared/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import { subMonths, subDays, format, addDays, addBusinessDays, isWeekend, isBefore, isAfter, parseISO } from "date-fns";

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;

  // Activities
  getActivities(): Promise<Activity[]>;
  getActivitiesByClient(clientId: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: string, activity: Partial<InsertActivity>): Promise<Activity>;
  deleteActivity(id: string): Promise<void>;

  // Print Jobs
  getPrintJobs(): Promise<PrintJob[]>;
  getPrintJobsByClient(clientId: string): Promise<PrintJob[]>;
  createPrintJob(job: InsertPrintJob): Promise<PrintJob>;
  updatePrintJob(id: string, job: Partial<InsertPrintJob>): Promise<PrintJob>;
  deletePrintJob(id: string): Promise<void>;

  // Surveys
  getSurveys(): Promise<Survey[]>;
  getSurveysByClient(clientId: string): Promise<Survey[]>;
  createSurvey(survey: InsertSurvey): Promise<Survey>;
  updateSurvey(id: string, survey: Partial<InsertSurvey>): Promise<Survey>;
  deleteSurvey(id: string): Promise<void>;

  // Call Records
  getCallRecords(): Promise<CallRecord[]>;
  getCallRecordsByClient(clientId: string): Promise<CallRecord[]>;
  getCallRecordsByStatus(status: string): Promise<CallRecord[]>;
  getCallRecordsByAssignee(userId: string): Promise<CallRecord[]>;
  getCallRecord(id: string): Promise<CallRecord | undefined>;
  createCallRecord(record: InsertCallRecord): Promise<CallRecord>;
  updateCallRecord(id: string, record: Partial<InsertCallRecord>): Promise<CallRecord>;
  deleteCallRecord(id: string): Promise<void>;

  // Client Mail Rules
  getClientMailRules(): Promise<ClientMailRule[]>;
  getClientMailRule(clientId: string): Promise<ClientMailRule | undefined>;
  createClientMailRule(rule: InsertClientMailRule): Promise<ClientMailRule>;
  updateClientMailRule(clientId: string, rule: Partial<InsertClientMailRule>): Promise<ClientMailRule>;
  deleteClientMailRule(clientId: string): Promise<void>;

  // Production Runs
  getProductionRuns(): Promise<ProductionRun[]>;
  getProductionRunsByClient(clientId: string): Promise<ProductionRun[]>;
  getProductionRunsByDateRange(startDate: string, endDate: string): Promise<ProductionRun[]>;
  getProductionRun(id: string): Promise<ProductionRun | undefined>;
  createProductionRun(run: InsertProductionRun): Promise<ProductionRun>;
  updateProductionRun(id: string, run: Partial<InsertProductionRun>): Promise<ProductionRun>;
  deleteProductionRun(id: string): Promise<void>;
  getUnapprovedRuns(): Promise<ProductionRun[]>;
  getLateRuns(): Promise<ProductionRun[]>;

  // Production Files
  getProductionFiles(): Promise<ProductionFile[]>;
  getProductionFilesByRun(runId: string): Promise<ProductionFile[]>;
  getProductionFile(id: string): Promise<ProductionFile | undefined>;
  createProductionFile(file: InsertProductionFile): Promise<ProductionFile>;
  updateProductionFile(id: string, file: Partial<InsertProductionFile>): Promise<ProductionFile>;
  deleteProductionFile(id: string): Promise<void>;

  // Mail Compliance Stats
  getMailComplianceStats(): Promise<{
    onTimePercent: number;
    avgBusinessDays: number;
    totalExceptions: number;
    unapprovedRuns: number;
  }>;

  // JobTrax Jobs
  getJobs(): Promise<Job[]>;
  getJobsByClient(clientId: string): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, job: Partial<InsertJob>): Promise<Job>;
  deleteJob(id: string): Promise<void>;

  // Message Templates
  getMessageTemplates(): Promise<MessageTemplate[]>;
  getMessageTemplate(id: string): Promise<MessageTemplate | undefined>;
  createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate>;

  // Bill Messages
  getBillMessages(): Promise<BillMessage[]>;
  getBillMessagesByStatus(status: string): Promise<BillMessage[]>;
  getBillMessage(id: string): Promise<BillMessage | undefined>;
  createBillMessage(message: InsertBillMessage): Promise<BillMessage>;
  updateBillMessage(id: string, message: Partial<InsertBillMessage>): Promise<BillMessage>;
  approveBillMessage(id: string, approvedBy: string): Promise<BillMessage>;
  rejectBillMessage(id: string, reason: string): Promise<BillMessage>;

  // eBill Sends
  getEBillSends(): Promise<EBillSend[]>;
  getEBillSendsByClient(clientId: string): Promise<EBillSend[]>;
  getEBillStats(): Promise<{ adoptionPercent: number; enrolled: number; delivered: number; bounced: number; pending: number }>;

  // Recent Activity Events
  getRecentActivityEvents(limit?: number): Promise<RecentActivityEvent[]>;
  createActivityEvent(event: InsertRecentActivityEvent): Promise<RecentActivityEvent>;

  // Confirmation Holds
  getConfirmationHolds(): Promise<ConfirmationHold[]>;
  getConfirmationHoldsByStatus(status: string): Promise<ConfirmationHold[]>;
  getConfirmationHoldsByClient(clientId: string): Promise<ConfirmationHold[]>;
  getConfirmationHold(id: string): Promise<ConfirmationHold | undefined>;
  createConfirmationHold(hold: InsertConfirmationHold): Promise<ConfirmationHold>;
  updateConfirmationHold(id: string, hold: Partial<InsertConfirmationHold>): Promise<ConfirmationHold>;
  releaseConfirmationHold(id: string, resolvedBy: string, notes?: string): Promise<ConfirmationHold>;
  rejectConfirmationHold(id: string, resolvedBy: string, notes?: string): Promise<ConfirmationHold>;
  getConfirmationHoldsStats(): Promise<{ active: number; released: number; rejected: number; expired: number; critical: number; overdue: number }>;

  // Production Runs with approval status
  getProductionRunsByApprovalStatus(status: string): Promise<ProductionRun[]>;

  // Seed & Reset
  seed(): Promise<void>;
  resetData(): Promise<void>;
  getDataStatus(): Promise<{ users: number; clients: number; activities: number; printJobs: number; surveys: number; callRecords: number; productionRuns: number; jobs: number; billMessages: number; eBillSends: number; lastReset: string }>;
}

let lastResetTimestamp = new Date().toISOString();

export class DbStorage implements IStorage {
  // Users
  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    return result[0];
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const result = await db.insert(clients).values(insertClient).returning();
    return result[0];
  }

  async updateClient(id: string, updateData: Partial<InsertClient>): Promise<Client> {
    const result = await db.update(clients).set(updateData).where(eq(clients.id, id)).returning();
    return result[0];
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Activities
  async getActivities(): Promise<Activity[]> {
    return db.select().from(activities).orderBy(desc(activities.date));
  }

  async getActivitiesByClient(clientId: string): Promise<Activity[]> {
    return db.select().from(activities).where(eq(activities.clientId, clientId)).orderBy(desc(activities.date));
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const result = await db.insert(activities).values(insertActivity).returning();
    
    // Update client lastActivityDate
    await db.update(clients)
      .set({ lastActivityDate: insertActivity.date })
      .where(eq(clients.id, insertActivity.clientId));
    
    return result[0];
  }

  async updateActivity(id: string, updateData: Partial<InsertActivity>): Promise<Activity> {
    const result = await db.update(activities).set(updateData).where(eq(activities.id, id)).returning();
    return result[0];
  }

  async deleteActivity(id: string): Promise<void> {
    await db.delete(activities).where(eq(activities.id, id));
  }

  // Print Jobs
  async getPrintJobs(): Promise<PrintJob[]> {
    return db.select().from(printJobs).orderBy(desc(printJobs.date));
  }

  async getPrintJobsByClient(clientId: string): Promise<PrintJob[]> {
    return db.select().from(printJobs).where(eq(printJobs.clientId, clientId)).orderBy(desc(printJobs.date));
  }

  async createPrintJob(insertJob: InsertPrintJob): Promise<PrintJob> {
    const result = await db.insert(printJobs).values(insertJob).returning();
    return result[0];
  }

  async updatePrintJob(id: string, updateData: Partial<InsertPrintJob>): Promise<PrintJob> {
    const result = await db.update(printJobs).set(updateData).where(eq(printJobs.id, id)).returning();
    return result[0];
  }

  async deletePrintJob(id: string): Promise<void> {
    await db.delete(printJobs).where(eq(printJobs.id, id));
  }

  // Surveys
  async getSurveys(): Promise<Survey[]> {
    return db.select().from(surveys).orderBy(desc(surveys.date));
  }

  async getSurveysByClient(clientId: string): Promise<Survey[]> {
    return db.select().from(surveys).where(eq(surveys.clientId, clientId)).orderBy(desc(surveys.date));
  }

  async createSurvey(insertSurvey: InsertSurvey): Promise<Survey> {
    const result = await db.insert(surveys).values(insertSurvey).returning();
    return result[0];
  }

  async updateSurvey(id: string, updateData: Partial<InsertSurvey>): Promise<Survey> {
    const result = await db.update(surveys).set(updateData).where(eq(surveys.id, id)).returning();
    return result[0];
  }

  async deleteSurvey(id: string): Promise<void> {
    await db.delete(surveys).where(eq(surveys.id, id));
  }

  // Call Records
  async getCallRecords(): Promise<CallRecord[]> {
    return db.select().from(callRecords).orderBy(desc(callRecords.startTime));
  }

  async getCallRecordsByClient(clientId: string): Promise<CallRecord[]> {
    return db.select().from(callRecords).where(eq(callRecords.clientId, clientId)).orderBy(desc(callRecords.startTime));
  }

  async getCallRecordsByStatus(status: string): Promise<CallRecord[]> {
    return db.select().from(callRecords).where(eq(callRecords.status, status)).orderBy(desc(callRecords.startTime));
  }

  async getCallRecordsByAssignee(userId: string): Promise<CallRecord[]> {
    return db.select().from(callRecords).where(eq(callRecords.assignedTo, userId)).orderBy(desc(callRecords.startTime));
  }

  async getCallRecord(id: string): Promise<CallRecord | undefined> {
    const result = await db.select().from(callRecords).where(eq(callRecords.id, id)).limit(1);
    return result[0];
  }

  async createCallRecord(insertRecord: InsertCallRecord): Promise<CallRecord> {
    const result = await db.insert(callRecords).values(insertRecord).returning();
    return result[0];
  }

  async updateCallRecord(id: string, updateData: Partial<InsertCallRecord>): Promise<CallRecord> {
    const result = await db.update(callRecords).set({ ...updateData, updatedAt: new Date().toISOString() }).where(eq(callRecords.id, id)).returning();
    return result[0];
  }

  async deleteCallRecord(id: string): Promise<void> {
    await db.delete(callRecords).where(eq(callRecords.id, id));
  }

  // Client Mail Rules
  async getClientMailRules(): Promise<ClientMailRule[]> {
    return db.select().from(clientMailRules);
  }

  async getClientMailRule(clientId: string): Promise<ClientMailRule | undefined> {
    const result = await db.select().from(clientMailRules).where(eq(clientMailRules.clientId, clientId)).limit(1);
    return result[0];
  }

  async createClientMailRule(insertRule: InsertClientMailRule): Promise<ClientMailRule> {
    const result = await db.insert(clientMailRules).values(insertRule).returning();
    return result[0];
  }

  async updateClientMailRule(clientId: string, updateData: Partial<InsertClientMailRule>): Promise<ClientMailRule> {
    const result = await db.update(clientMailRules).set({ ...updateData, updatedAt: new Date().toISOString() }).where(eq(clientMailRules.clientId, clientId)).returning();
    return result[0];
  }

  async deleteClientMailRule(clientId: string): Promise<void> {
    await db.delete(clientMailRules).where(eq(clientMailRules.clientId, clientId));
  }

  // Production Runs
  async getProductionRuns(): Promise<ProductionRun[]> {
    return db.select().from(productionRuns).orderBy(desc(productionRuns.importDateTime));
  }

  async getProductionRunsByClient(clientId: string): Promise<ProductionRun[]> {
    return db.select().from(productionRuns).where(eq(productionRuns.clientId, clientId)).orderBy(desc(productionRuns.importDateTime));
  }

  async getProductionRunsByDateRange(startDate: string, endDate: string): Promise<ProductionRun[]> {
    return db.select().from(productionRuns)
      .where(and(
        gte(productionRuns.importDateTime, new Date(startDate).toISOString()),
        lte(productionRuns.importDateTime, new Date(endDate).toISOString())
      ))
      .orderBy(desc(productionRuns.importDateTime));
  }

  async getProductionRun(id: string): Promise<ProductionRun | undefined> {
    const result = await db.select().from(productionRuns).where(eq(productionRuns.id, id)).limit(1);
    return result[0];
  }

  async createProductionRun(insertRun: InsertProductionRun): Promise<ProductionRun> {
    const result = await db.insert(productionRuns).values(insertRun).returning();
    return result[0];
  }

  async updateProductionRun(id: string, updateData: Partial<InsertProductionRun>): Promise<ProductionRun> {
    const result = await db.update(productionRuns).set({ ...updateData, updatedAt: new Date().toISOString() }).where(eq(productionRuns.id, id)).returning();
    return result[0];
  }

  async deleteProductionRun(id: string): Promise<void> {
    await db.delete(productionRuns).where(eq(productionRuns.id, id));
  }

  async getUnapprovedRuns(): Promise<ProductionRun[]> {
    return db.select().from(productionRuns)
      .where(eq(productionRuns.approvalStatus, 'Pending'))
      .orderBy(desc(productionRuns.importDateTime));
  }

  async getLateRuns(): Promise<ProductionRun[]> {
    return db.select().from(productionRuns)
      .where(eq(productionRuns.isOnTime, 0))
      .orderBy(desc(productionRuns.importDateTime));
  }

  async getProductionRunsByApprovalStatus(status: string): Promise<ProductionRun[]> {
    return db.select().from(productionRuns)
      .where(eq(productionRuns.approvalStatus, status))
      .orderBy(desc(productionRuns.importDateTime));
  }

  async approveProductionRun(id: string, approvedBy: string): Promise<ProductionRun> {
    const result = await db.update(productionRuns)
      .set({
        approvalStatus: 'Approved',
        approvedBy,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(eq(productionRuns.id, id))
      .returning();
    return result[0];
  }

  // Production Files
  async getProductionFiles(): Promise<ProductionFile[]> {
    return db.select().from(productionFiles);
  }

  async getProductionFilesByRun(runId: string): Promise<ProductionFile[]> {
    return db.select().from(productionFiles).where(eq(productionFiles.productionRunId, runId));
  }

  async getProductionFile(id: string): Promise<ProductionFile | undefined> {
    const result = await db.select().from(productionFiles).where(eq(productionFiles.id, id)).limit(1);
    return result[0];
  }

  async createProductionFile(insertFile: InsertProductionFile): Promise<ProductionFile> {
    const result = await db.insert(productionFiles).values(insertFile).returning();
    return result[0];
  }

  async updateProductionFile(id: string, updateData: Partial<InsertProductionFile>): Promise<ProductionFile> {
    const result = await db.update(productionFiles).set(updateData).where(eq(productionFiles.id, id)).returning();
    return result[0];
  }

  async deleteProductionFile(id: string): Promise<void> {
    await db.delete(productionFiles).where(eq(productionFiles.id, id));
  }

  // Mail Compliance Stats
  async getMailComplianceStats(): Promise<{
    onTimePercent: number;
    avgBusinessDays: number;
    totalExceptions: number;
    unapprovedRuns: number;
  }> {
    const allRuns = await db.select().from(productionRuns);
    const mailedRuns = allRuns.filter((r: ProductionRun) => r.actualMailDate !== null);
    const onTimeRuns = mailedRuns.filter((r: ProductionRun) => r.isOnTime === 1);
    const lateRuns = mailedRuns.filter((r: ProductionRun) => r.isOnTime === 0);
    const unapprovedRuns = allRuns.filter((r: ProductionRun) => r.approvalStatus === 'Pending');

    // Calculate average business days for mailed runs
    let totalBusinessDays = 0;
    mailedRuns.forEach((run: ProductionRun) => {
      if (run.actualMailDate && run.importDateTime) {
        const importDate = new Date(run.importDateTime);
        const mailDate = parseISO(run.actualMailDate);
        const diffDays = Math.floor((mailDate.getTime() - importDate.getTime()) / (1000 * 60 * 60 * 24));
        totalBusinessDays += diffDays;
      }
    });

    const avgBusinessDays = mailedRuns.length > 0 ? totalBusinessDays / mailedRuns.length : 0;
    const onTimePercent = mailedRuns.length > 0 ? (onTimeRuns.length / mailedRuns.length) * 100 : 0;

    return {
      onTimePercent: Math.round(onTimePercent * 10) / 10,
      avgBusinessDays: Math.round(avgBusinessDays * 10) / 10,
      totalExceptions: lateRuns.length,
      unapprovedRuns: unapprovedRuns.length,
    };
  }

  // JobTrax Jobs
  async getJobs(): Promise<Job[]> {
    return db.select().from(jobs).orderBy(desc(jobs.startedAt));
  }

  async getJobsByClient(clientId: string): Promise<Job[]> {
    return db.select().from(jobs).where(eq(jobs.clientId, clientId)).orderBy(desc(jobs.startedAt));
  }

  async getJob(id: string): Promise<Job | undefined> {
    const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    return result[0];
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const result = await db.insert(jobs).values(insertJob).returning();
    return result[0];
  }

  async updateJob(id: string, updateData: Partial<InsertJob>): Promise<Job> {
    const result = await db.update(jobs).set({ ...updateData, updatedAt: new Date().toISOString() }).where(eq(jobs.id, id)).returning();
    return result[0];
  }

  async deleteJob(id: string): Promise<void> {
    await db.delete(jobs).where(eq(jobs.id, id));
  }

  // Message Templates
  async getMessageTemplates(): Promise<MessageTemplate[]> {
    return db.select().from(messageTemplates).where(eq(messageTemplates.isActive, 1));
  }

  async getMessageTemplate(id: string): Promise<MessageTemplate | undefined> {
    const result = await db.select().from(messageTemplates).where(eq(messageTemplates.id, id)).limit(1);
    return result[0];
  }

  async createMessageTemplate(insertTemplate: InsertMessageTemplate): Promise<MessageTemplate> {
    const result = await db.insert(messageTemplates).values(insertTemplate).returning();
    return result[0];
  }

  // Bill Messages
  async getBillMessages(): Promise<BillMessage[]> {
    return db.select().from(billMessages).orderBy(desc(billMessages.updatedAt));
  }

  async getBillMessagesByStatus(status: string): Promise<BillMessage[]> {
    return db.select().from(billMessages).where(eq(billMessages.status, status)).orderBy(desc(billMessages.updatedAt));
  }

  async getBillMessage(id: string): Promise<BillMessage | undefined> {
    const result = await db.select().from(billMessages).where(eq(billMessages.id, id)).limit(1);
    return result[0];
  }

  async createBillMessage(insertMessage: InsertBillMessage): Promise<BillMessage> {
    const result = await db.insert(billMessages).values(insertMessage).returning();
    return result[0];
  }

  async updateBillMessage(id: string, updateData: Partial<InsertBillMessage>): Promise<BillMessage> {
    const result = await db.update(billMessages).set({ ...updateData, updatedAt: new Date().toISOString() }).where(eq(billMessages.id, id)).returning();
    return result[0];
  }

  async approveBillMessage(id: string, approvedBy: string): Promise<BillMessage> {
    const result = await db.update(billMessages)
      .set({
        status: 'Approved',
        approvedBy,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(eq(billMessages.id, id))
      .returning();
    return result[0];
  }

  async rejectBillMessage(id: string, reason: string): Promise<BillMessage> {
    const result = await db.update(billMessages)
      .set({
        status: 'Rejected',
        rejectionReason: reason,
        updatedAt: new Date().toISOString()
      })
      .where(eq(billMessages.id, id))
      .returning();
    return result[0];
  }

  // eBill Sends
  async getEBillSends(): Promise<EBillSend[]> {
    return db.select().from(eBillSends).orderBy(desc(eBillSends.sendDate));
  }

  async getEBillSendsByClient(clientId: string): Promise<EBillSend[]> {
    return db.select().from(eBillSends).where(eq(eBillSends.clientId, clientId)).orderBy(desc(eBillSends.sendDate));
  }

  async getEBillStats(): Promise<{ adoptionPercent: number; enrolled: number; delivered: number; bounced: number; pending: number }> {
    const sends = await db.select().from(eBillSends);
    const delivered = sends.filter(s => s.deliveryStatus === 'Delivered').length;
    const bounced = sends.filter(s => s.deliveryStatus === 'Bounced').length;
    const pending = sends.filter(s => s.deliveryStatus === 'Pending').length;
    const enrolled = sends.length; // Simplified: count of sends
    const adoptionPercent = enrolled > 0 ? 35.5 : 0; // Mock value

    return {
      adoptionPercent,
      enrolled,
      delivered,
      bounced,
      pending,
    };
  }

  // Recent Activity Events
  async getRecentActivityEvents(limit: number = 100): Promise<RecentActivityEvent[]> {
    return db.select().from(recentActivityEvents).orderBy(desc(recentActivityEvents.timestamp)).limit(limit);
  }

  async createActivityEvent(insertEvent: InsertRecentActivityEvent): Promise<RecentActivityEvent> {
    const result = await db.insert(recentActivityEvents).values(insertEvent).returning();
    return result[0];
  }

  // Confirmation Holds
  async getConfirmationHolds(): Promise<ConfirmationHold[]> {
    return db.select().from(confirmationHolds).orderBy(desc(confirmationHolds.holdStartedAt));
  }

  async getConfirmationHoldsByStatus(status: string): Promise<ConfirmationHold[]> {
    return db.select().from(confirmationHolds)
      .where(eq(confirmationHolds.status, status))
      .orderBy(desc(confirmationHolds.holdStartedAt));
  }

  async getConfirmationHoldsByClient(clientId: string): Promise<ConfirmationHold[]> {
    return db.select().from(confirmationHolds)
      .where(eq(confirmationHolds.clientId, clientId))
      .orderBy(desc(confirmationHolds.holdStartedAt));
  }

  async getConfirmationHold(id: string): Promise<ConfirmationHold | undefined> {
    const results = await db.select().from(confirmationHolds).where(eq(confirmationHolds.id, id));
    return results[0];
  }

  async createConfirmationHold(hold: InsertConfirmationHold): Promise<ConfirmationHold> {
    const result = await db.insert(confirmationHolds).values(hold).returning();
    return result[0];
  }

  async updateConfirmationHold(id: string, hold: Partial<InsertConfirmationHold>): Promise<ConfirmationHold> {
    const result = await db.update(confirmationHolds)
      .set({ ...hold, updatedAt: new Date().toISOString() })
      .where(eq(confirmationHolds.id, id))
      .returning();
    return result[0];
  }

  async releaseConfirmationHold(id: string, resolvedBy: string, notes?: string): Promise<ConfirmationHold> {
    const result = await db.update(confirmationHolds)
      .set({ 
        status: 'Released',
        resolution: 'Released',
        resolvedBy,
        resolvedAt: new Date().toISOString(),
        resolutionNotes: notes || 'Hold released',
        updatedAt: new Date().toISOString()
      })
      .where(eq(confirmationHolds.id, id))
      .returning();
    return result[0];
  }

  async rejectConfirmationHold(id: string, resolvedBy: string, notes?: string): Promise<ConfirmationHold> {
    const result = await db.update(confirmationHolds)
      .set({ 
        status: 'Rejected',
        resolution: 'Rejected',
        resolvedBy,
        resolvedAt: new Date().toISOString(),
        resolutionNotes: notes || 'Hold rejected',
        updatedAt: new Date().toISOString()
      })
      .where(eq(confirmationHolds.id, id))
      .returning();
    return result[0];
  }

  async getConfirmationHoldsStats(): Promise<{ active: number; released: number; rejected: number; expired: number; critical: number; overdue: number }> {
    const allHolds = await db.select().from(confirmationHolds);
    const now = new Date();
    return {
      active: allHolds.filter(h => h.status === 'Active').length,
      released: allHolds.filter(h => h.status === 'Released').length,
      rejected: allHolds.filter(h => h.status === 'Rejected').length,
      expired: allHolds.filter(h => h.status === 'Expired').length,
      critical: allHolds.filter(h => h.status === 'Active' && h.priority === 'Critical').length,
      overdue: allHolds.filter(h => h.status === 'Active' && h.dueDate && new Date(h.dueDate) < now).length,
    };
  }

  async getProductionRunsByApprovalStatus(status: string): Promise<ProductionRun[]> {
    return db.select().from(productionRuns)
      .where(eq(productionRuns.approvalStatus, status))
      .orderBy(desc(productionRuns.importDateTime));
  }

  // Data Status
  async getDataStatus() {
    const allUsers = await db.select().from(users);
    const allClients = await db.select().from(clients);
    const allActivities = await db.select().from(activities);
    const allPrintJobs = await db.select().from(printJobs);
    const allSurveys = await db.select().from(surveys);
    const allCallRecords = await db.select().from(callRecords);
    const allProductionRuns = await db.select().from(productionRuns);
    const allJobs = await db.select().from(jobs);
    const allBillMessages = await db.select().from(billMessages);
    const allEBillSends = await db.select().from(eBillSends);

    return {
      users: allUsers.length,
      clients: allClients.length,
      activities: allActivities.length,
      printJobs: allPrintJobs.length,
      surveys: allSurveys.length,
      callRecords: allCallRecords.length,
      productionRuns: allProductionRuns.length,
      jobs: allJobs.length,
      billMessages: allBillMessages.length,
      eBillSends: allEBillSends.length,
      lastReset: lastResetTimestamp
    };
  }

  // Reset all data and reseed
  async resetData(): Promise<void> {
    // Delete all data in correct order (respect foreign keys)
    await db.delete(confirmationHolds);
    await db.delete(recentActivityEvents);
    await db.delete(eBillSends);
    await db.delete(billMessages);
    await db.delete(messageTemplates);
    await db.delete(jobs);
    await db.delete(productionFiles); // Delete child records first
    await db.delete(callRecords);
    await db.delete(productionRuns);
    await db.delete(clientMailRules);
    await db.delete(surveys);
    await db.delete(printJobs);
    await db.delete(activities);
    await db.delete(clients);
    await db.delete(users);
    
    lastResetTimestamp = new Date().toISOString();
    
    // Reseed
    await this.seed();
    
    console.log('✅ Database reset and reseeded');
  }

  // Comprehensive seed with realistic scale data
  async seed(): Promise<void> {
    // Check if already seeded
    const existingUsers = await this.getUsers();
    if (existingUsers.length > 0) return;

    console.log('🌱 Seeding database with demo data...');

    // 1. Seed users (with hashed passwords)
    const seedUsers: InsertUser[] = [
      { id: 'u1', username: 'admin', password: hashPassword('admin123'), fullName: 'Sarah Admin', role: 'Admin' },
      { id: 'u2', username: 'manager', password: hashPassword('manager123'), fullName: 'Mike Manager', role: 'Manager' },
      { id: 'u3', username: 'analyst', password: hashPassword('analyst123'), fullName: 'Alice Analyst', role: 'Analyst' },
      { id: 'u4', username: 'readonly', password: hashPassword('readonly123'), fullName: 'Bob Viewer', role: 'ReadOnly' },
    ];
    await db.insert(users).values(seedUsers);

    // 2. Generate 280 clients for realistic scale
    const seedClients: InsertClient[] = [];
    const utilityTypes = ['Water', 'Electric', 'Gas', 'Multi-Service'];
    const states = ['TX', 'CA', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'AZ', 'WA', 'MA', 'CO', 'OR'];
    const providers = ['DDSY', 'DDS', 'Other'];
    const cityPrefixes = ['Metro', 'City of', 'County of', 'Regional', 'Central', 'North', 'South', 'East', 'West'];
    const utilitySuffixes = ['Water District', 'Electric', 'Power Co.', 'Utility', 'Gas & Electric', 'Public Works', 'Services'];
    
    // First, create key featured clients
    const featuredClients = [
      {
        id: 'c1',
        name: 'Metro Water District',
        code: 'CLT-1000',
        utilityType: 'Water',
        state: 'TX',
        status: 'Active',
        provider: 'DDSY',
        assignedManager: 'u1',
        lastActivityDate: format(new Date(), 'yyyy-MM-dd'),
        contractStartDate: '2023-01-15',
        tags: JSON.stringify(['Priority', 'High Volume']),
        contactEmail: 'contact@metrowater.com',
        contactPhone: '555-0100',
      },
      {
        id: 'c2',
        name: 'Lakeside Power Co.',
        code: 'CLT-1001',
        utilityType: 'Gas',
        state: 'FL',
        status: 'At-Risk',
        provider: 'DDSY',
        assignedManager: 'u3',
        lastActivityDate: format(subMonths(new Date(), 2), 'yyyy-MM-dd'),
        contractStartDate: '2023-03-10',
        tags: JSON.stringify(['At-Risk', 'Needs Attention']),
        contactEmail: 'ops@lakesidepower.com',
        contactPhone: '555-0120',
      },
      {
        id: 'c3',
        name: 'Summit Multi-Utility Services',
        code: 'CLT-1002',
        utilityType: 'Multi-Service',
        state: 'NY',
        status: 'At-Risk',
        provider: 'Other',
        assignedManager: 'u2',
        lastActivityDate: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
        contractStartDate: '2021-09-20',
        tags: JSON.stringify(['At-Risk', 'Delinquent']),
        contactEmail: 'contact@summitutility.com',
        contactPhone: '555-0130',
      },
    ];
    seedClients.push(...featuredClients);

    // Generate remaining clients (277 more to reach ~280 total)
    for (let i = 4; i <= 280; i++) {
      const prefix = cityPrefixes[Math.floor(Math.random() * cityPrefixes.length)];
      const suffix = utilitySuffixes[Math.floor(Math.random() * utilitySuffixes.length)];
      const cityName = `${prefix} ${suffix} ${i}`;
      const isActive = Math.random() > 0.02; // 98% active, 2% at-risk
      
      seedClients.push({
        id: `c${i}`,
        name: cityName,
        code: `CLT-${1000 + i}`,
        utilityType: utilityTypes[Math.floor(Math.random() * utilityTypes.length)],
        state: states[Math.floor(Math.random() * states.length)],
        status: isActive ? 'Active' : 'At-Risk',
        provider: providers[Math.floor(Math.random() * providers.length)],
        assignedManager: seedUsers[Math.floor(Math.random() * 3)].id,
        lastActivityDate: format(subMonths(new Date(), isActive ? 0 : Math.floor(Math.random() * 3)), 'yyyy-MM-dd'),
        contractStartDate: format(subMonths(new Date(), Math.floor(Math.random() * 36) + 12), 'yyyy-MM-dd'),
        tags: isActive ? '[]' : JSON.stringify(['At-Risk']),
        contactEmail: `contact@utility${i}.com`,
        contactPhone: `555-${String(i).padStart(4, '0')}`,
      });
    }
    
    // Insert in batches to avoid overwhelming the DB
    const batchSize = 50;
    for (let i = 0; i < seedClients.length; i += batchSize) {
      await db.insert(clients).values(seedClients.slice(i, i + batchSize));
    }
    console.log(`   ✓ Created ${seedClients.length} clients`);

    // 3. Seed activities - only for featured clients and random sample (200 activities total)
    const activityTypes = ['Call Center', 'Collections', 'Invoices', 'Support', 'Onboarding', 'Training'];
    const statuses = ['Done', 'In Progress', 'Open', 'Blocked'];
    const outcomes = ['Resolved', 'Follow-up needed', 'Escalated', 'Closed', null];
    const seedActivities: InsertActivity[] = [];
    
    // Select 50 clients for activities (3 featured + 47 random)
    const activeClientSample = [
      ...featuredClients,
      ...seedClients.slice(3, 50).filter(() => Math.random() > 0.2)
    ];
    
    let activityId = 1;
    for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
      const monthDate = subMonths(new Date(), monthsAgo);
      
      // Only sample clients get activities
      for (const client of activeClientSample) {
        const numActivities = Math.floor(Math.random() * 2) + 1; // 1-2 activities per month
        
        for (let i = 0; i < numActivities; i++) {
          const dayOffset = Math.floor(Math.random() * 28);
          const activityDate = format(addDays(monthDate, dayOffset), 'yyyy-MM-dd');
          
          seedActivities.push({
            id: `act-${activityId++}`,
            clientId: client.id,
            type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
            date: activityDate,
            ownerId: seedUsers[Math.floor(Math.random() * 3)].id,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            effortHours: String(Math.floor(Math.random() * 8) + 1),
            outcome: outcomes[Math.floor(Math.random() * outcomes.length)] || null,
            valueScore: Math.floor(Math.random() * 5) + 1 as 1 | 2 | 3 | 4 | 5,
            notes: `Activity for ${client.name}`,
            attachmentCount: Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0,
          });
        }
      }
    }
    await db.insert(activities).values(seedActivities);
    console.log(`   ✓ Created ${seedActivities.length} activities`);

    // 4. Seed print jobs with realistic volumes for 30-day target of 120K-650K pieces
    // Target: ~400K pieces/30 days = ~13.3K pieces/day across all clients
    const seedPrintJobs: InsertPrintJob[] = [];
    
    let printJobId = 1;
    for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
      const monthDate = subMonths(new Date(), monthsAgo);
      
      // Seasonality: higher volume in summer months (May-Aug)
      const month = monthDate.getMonth();
      const seasonalMultiplier = (month >= 4 && month <= 7) ? 1.2 : 1.0;
      
      // Each client averages 1 print job per month with varying sizes
      // Small clients: 100-500 pieces, Medium: 500-2000, Large: 2000-8000
      for (const client of seedClients) {
        if (Math.random() > 0.25) { // 75% of clients have print jobs
          const clientSize = Math.random();
          let pieces: number;
          
          if (clientSize < 0.6) { // 60% small
            pieces = Math.floor((100 + Math.random() * 400) * seasonalMultiplier);
          } else if (clientSize < 0.9) { // 30% medium
            pieces = Math.floor((500 + Math.random() * 1500) * seasonalMultiplier);
          } else { // 10% large
            pieces = Math.floor((2000 + Math.random() * 6000) * seasonalMultiplier);
          }
          
          const pages = Math.floor(pieces * 2.5);
          const costPerPiece = 0.28; // Adjusted for target spend range
          
          seedPrintJobs.push({
            id: `pj-${printJobId++}`,
            date: format(addDays(monthDate, Math.floor(Math.random() * 28)), 'yyyy-MM-dd'),
            clientId: client.id,
            provider: client.provider === 'Other' ? providers[Math.floor(Math.random() * 3)] : client.provider,
            pieces,
            pages,
            cost: String(Math.floor(pieces * costPerPiece)),
            status: Math.random() > 0.05 ? 'Completed' : 'Processing',
          });
        }
      }
    }
    await db.insert(printJobs).values(seedPrintJobs);
    console.log(`   ✓ Created ${seedPrintJobs.length} print jobs`);

    // 5. Seed surveys - targeting average 6.8-9.2 (quarterly, sample of clients)
    const surveyTypes = ['NPS', 'CSAT', 'Onboarding'];
    const seedSurveys: InsertSurvey[] = [];
    const lowScoreSurveys: string[] = [];
    
    // Only survey ~15% of clients each quarter
    const surveyedClients = seedClients.filter(() => Math.random() < 0.15);
    
    let surveyId = 1;
    for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo -= 3) { // Quarterly
      const surveyDate = subMonths(new Date(), monthsAgo);
      
      for (const client of surveyedClients) {
        // 70% response rate
        if (Math.random() > 0.3) {
          // At-Risk clients (c2, c3) get lower scores
          const isAtRisk = client.status === 'At-Risk';
          
          // Target distribution: mostly 7-9, some 10s, few 5-6s
          let score: number;
          const rand = Math.random();
          if (isAtRisk) {
            // At-risk: 5-7 range
            score = 5 + Math.floor(Math.random() * 3);
          } else if (rand < 0.15) {
            // 15% get perfect 10
            score = 10;
          } else if (rand < 0.75) {
            // 60% get 8-9
            score = 8 + Math.floor(Math.random() * 2);
          } else {
            // 25% get 7
            score = 7;
          }
          
          const surveyIdStr = `srv-${surveyId++}`;
          const comments = score <= 6 
            ? 'Service could be improved' 
            : score >= 9 
            ? 'Excellent service!' 
            : 'Good overall experience';
          
          seedSurveys.push({
            id: surveyIdStr,
            date: format(addDays(surveyDate, Math.floor(Math.random() * 28)), 'yyyy-MM-dd'),
            clientId: client.id,
            type: surveyTypes[Math.floor(Math.random() * surveyTypes.length)],
            score,
            comments,
            linkedActivityId: null,
          });
          
          if (score <= 6) {
            lowScoreSurveys.push(surveyIdStr);
          }
        }
      }
    }
    
    if (seedSurveys.length > 0) {
      await db.insert(surveys).values(seedSurveys);
    }
    console.log(`   ✓ Created ${seedSurveys.length} surveys`);

    // 6. Create follow-up activities for low-score surveys
    const followUpActivities: InsertActivity[] = [];
    const surveyActivityLinks: { surveyId: string; activityId: string }[] = [];
    
    for (const surveyId of lowScoreSurveys) {
      const survey = seedSurveys.find(s => s.id === surveyId);
      if (survey) {
        const followUpActivityId = `act-${activityId++}`;
        const followUpDate = format(addDays(new Date(survey.date), 3), 'yyyy-MM-dd');
        
        followUpActivities.push({
          id: followUpActivityId,
          clientId: survey.clientId,
          type: 'Support',
          date: followUpDate,
          ownerId: 'u2', // Manager follows up
          status: 'Done',
          effortHours: '2',
          outcome: 'Resolved concerns',
          valueScore: 4,
          notes: `Follow-up on low survey score (${survey.score}/10)`,
          attachmentCount: 0,
        });
        
        surveyActivityLinks.push({ surveyId, activityId: followUpActivityId });
      }
    }
    
    // Insert follow-up activities
    if (followUpActivities.length > 0) {
      await db.insert(activities).values(followUpActivities);
      
      // Now link surveys to their follow-up activities
      for (const link of surveyActivityLinks) {
        await db.update(surveys)
          .set({ linkedActivityId: link.activityId })
          .where(eq(surveys.id, link.surveyId));
      }
    }

    // 7. Seed call center records (1000+ realistic calls over last 90 days)
    const callReasons = ['Billing', 'Technical', 'Payment', 'General'];
    const callStatuses = ['Open', 'In Progress', 'Resolved', 'Escalated', 'Callback Scheduled'];
    const contactChannels = ['phone', 'email', 'chat'];
    const seedCallRecords: InsertCallRecord[] = [];
    
    let callId = 1;
    // Generate calls over last 90 days with daily variation
    for (let daysAgo = 89; daysAgo >= 0; daysAgo--) {
      const callDate = subDays(new Date(), daysAgo);
      
      // 12-20 calls per day average, more on Mon/Tue, less on Fri
      const dayOfWeek = callDate.getDay();
      const baseCallsPerDay = dayOfWeek === 1 || dayOfWeek === 2 ? 18 : dayOfWeek === 5 ? 10 : 14;
      const callsToday = Math.floor(baseCallsPerDay + Math.random() * 6);
      
      for (let i = 0; i < callsToday; i++) {
        // Pick a random client (weighted toward first 100 clients for activity concentration)
        const clientIndex = Math.random() < 0.7 
          ? Math.floor(Math.random() * Math.min(100, seedClients.length))
          : Math.floor(Math.random() * seedClients.length);
        const client = seedClients[clientIndex];
        
        // Assign to agent (u1, u2, u3 are agents)
        const assignedTo = Math.random() > 0.1 ? seedUsers[Math.floor(Math.random() * 3)].id : null;
        
        // Pick reason and determine typical outcome
        const callReason = callReasons[Math.floor(Math.random() * callReasons.length)];
        const isOlderCall = daysAgo > 7;
        
        // Status distribution: most resolved if older, mix if recent
        let status: string;
        if (isOlderCall) {
          const rand = Math.random();
          if (rand < 0.75) status = 'Resolved';
          else if (rand < 0.85) status = 'Escalated';
          else if (rand < 0.95) status = 'Callback Scheduled';
          else status = 'Open';
        } else {
          const rand = Math.random();
          if (rand < 0.35) status = 'Resolved';
          else if (rand < 0.55) status = 'In Progress';
          else if (rand < 0.70) status = 'Open';
          else if (rand < 0.85) status = 'Callback Scheduled';
          else status = 'Escalated';
        }
        
        // Handle time: 120-840 seconds (2-14 minutes), avg ~6 min
        const handleTimeSeconds = status === 'Resolved' || status === 'Escalated'
          ? Math.floor(Math.random() * 720) + 120
          : null;
        
        // Generate realistic times
        const callHour = 8 + Math.floor(Math.random() * 9); // 8am-5pm
        const callMinute = Math.floor(Math.random() * 60);
        const startTime = new Date(callDate);
        startTime.setHours(callHour, callMinute, 0, 0);
        
        const endTime = status === 'Resolved' && handleTimeSeconds
          ? new Date(startTime.getTime() + handleTimeSeconds * 1000)
          : null;
        
        // Callback date if callback scheduled
        const callbackDate = status === 'Callback Scheduled'
          ? addDays(callDate, Math.floor(Math.random() * 3) + 1)
          : null;
        
        seedCallRecords.push({
          id: `call-${callId++}`,
          clientId: client.id,
          callerName: `Contact at ${client.name}`,
          callerPhone: client.contactPhone || `555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          callerEmail: client.contactEmail || `contact${clientIndex}@utility.com`,
          contactChannel: contactChannels[Math.floor(Math.random() * contactChannels.length)],
          callReason,
          subcategory: null,
          priority: callReason === 'Technical' || status === 'Escalated' ? 'High' : Math.random() > 0.7 ? 'High' : 'Medium',
          status,
          assignedTo,
          summary: `${callReason} inquiry - ${client.name}`,
          detailedNotes: status === 'Resolved' ? `Resolved ${callReason.toLowerCase()} issue` : `Working on ${callReason.toLowerCase()}`,
          startTime: startTime.toISOString(),
          endTime: endTime ? endTime.toISOString() : null,
          handleTime: handleTimeSeconds,
          wrapUpTime: handleTimeSeconds ? Math.floor(Math.random() * 120) + 30 : null,
          disposition: status === 'Resolved' ? 'resolved' : status === 'Escalated' ? 'escalated' : status === 'Callback Scheduled' ? 'callback_scheduled' : null,
          resolutionCode: status === 'Resolved' ? 'Issue resolved successfully' : null,
          resolutionLevel: assignedTo ? 'Tier 1' : null,
          firstContactResolution: status === 'Resolved' ? 1 : 0,
          satisfactionScore: status === 'Resolved' ? Math.floor(Math.random() * 2) + 4 : null,
          linkedActivityId: null,
          escalatedTo: status === 'Escalated' ? ['Collections', 'Billing', 'Technical'][Math.floor(Math.random() * 3)] : null,
          callbackDate: callbackDate ? callbackDate.toISOString() : null,
          callbackNotes: callbackDate ? 'Follow up on resolution' : null,
        });
      }
    }

    // Insert in batches
    for (let i = 0; i < seedCallRecords.length; i += 100) {
      await db.insert(callRecords).values(seedCallRecords.slice(i, i + 100));
    }
    console.log(`   ✓ Created ${seedCallRecords.length} call center records`);

    // 8. Update client lastActivityDate to most recent activity or call
    for (const client of seedClients) {
      const clientActivities = seedActivities.filter(a => a.clientId === client.id);
      const clientCalls = seedCallRecords.filter(c => c.clientId === client.id);

      const dates: Date[] = [];
      if (clientActivities.length > 0) {
        dates.push(...clientActivities.map(a => new Date(a.date)));
      }
      if (clientCalls.length > 0) {
        dates.push(...clientCalls.map(c => new Date(c.startTime)));
      }
      
      if (dates.length > 0) {
        const latestDate = dates.sort((a, b) => b.getTime() - a.getTime())[0];
        await db.update(clients)
          .set({ lastActivityDate: format(latestDate, 'yyyy-MM-dd') })
          .where(eq(clients.id, client.id));
      }
    }

    // 9. Seed Client Mail Rules for ~60% of clients
    console.log('   ⏳ Seeding client mail rules...');
    const seedMailRules: InsertClientMailRule[] = [];
    const clientsWithRules = seedClients.slice(0, Math.floor(seedClients.length * 0.6)); // 60% of clients
    
    for (const client of clientsWithRules) {
      // Most municipalities mail Mon-Fri, some exclude Friday
      const allowedMailDays = Math.random() > 0.8
        ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday'] // Some don't mail on Fridays
        : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      
      // Standard SLA is 2-3 business days, some strict clients have 1-2 days
      const maxSlaBusinessDays = client.status === 'At-Risk' || Math.random() > 0.7
        ? Math.floor(Math.random() * 2) + 1 // 1-2 days for strict/at-risk
        : Math.floor(Math.random() * 2) + 2; // 2-3 days for normal
      
      // Some have hard deadlines (e.g., must mail by 15th of month)
      const hardDeadlineDay = Math.random() > 0.85
        ? String(Math.floor(Math.random() * 20) + 10) // 10-30th of month
        : null;
      
      // Blackout dates (holidays, etc.)
      const blackoutDates: string[] = [];
      if (Math.random() > 0.7) {
        // Add some blackout dates for holidays
        blackoutDates.push('2025-12-25', '2026-01-01', '2025-11-28');
      }
      
      seedMailRules.push({
        id: `mr-${client.id}`,
        clientId: client.id,
        allowedMailDays: JSON.stringify(allowedMailDays),
        blackoutDates: JSON.stringify(blackoutDates),
        maxSlaBusinessDays,
        hardDeadlineDay,
        notes: hardDeadlineDay ? `Must mail by ${hardDeadlineDay}th of month` : null,
      });
    }
    
    await db.insert(clientMailRules).values(seedMailRules);
    console.log(`   ✓ Created ${seedMailRules.length} client mail rules`);

    // 10. Seed Production Runs with realistic scenarios
    console.log('   ⏳ Seeding production runs...');
    const seedProductionRuns: InsertProductionRun[] = [];
    const seedProductionFiles: InsertProductionFile[] = [];
    let runId = 1;
    let fileId = 1;
    
    // Helper function to calculate next business day considering mail rules
    function calculateTargetMailDate(importDate: Date, clientId: string, slaBusinessDays: number): string {
      const rule = seedMailRules.find(r => r.clientId === clientId);
      const allowedDays: string[] = rule?.allowedMailDays ? JSON.parse(rule.allowedMailDays) : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const blackoutDates: string[] = rule?.blackoutDates ? JSON.parse(rule.blackoutDates) : [];
      
      let targetDate = new Date(importDate);
      let businessDaysAdded = 0;
      
      while (businessDaysAdded < slaBusinessDays) {
        targetDate = addDays(targetDate, 1);
        const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
        const dateStr = format(targetDate, 'yyyy-MM-dd');
        
        // Skip weekends, non-allowed days, and blackout dates
        if (!isWeekend(targetDate) && allowedDays.includes(dayName) && !blackoutDates.includes(dateStr)) {
          businessDaysAdded++;
        }
      }
      
      return format(targetDate, 'yyyy-MM-dd');
    }
    
    // Create 2-4 production runs per client over the last 60 days
    const productionClients = seedClients.slice(0, 150); // 150 active clients with production runs
    
    for (const client of productionClients) {
      const clientRule = seedMailRules.find(r => r.clientId === client.id);
      const runsCount = Math.floor(Math.random() * 3) + 2; // 2-4 runs per client
      
      for (let r = 0; r < runsCount; r++) {
        const daysAgo = Math.floor(Math.random() * 60); // Last 60 days
        const importDateTime = subDays(new Date(), daysAgo);
        importDateTime.setHours(Math.floor(Math.random() * 4) + 6, Math.floor(Math.random() * 60), 0, 0); // 6am-10am imports
        
        const slaBusinessDays = clientRule?.maxSlaBusinessDays || 3;
        const targetMailDate = calculateTargetMailDate(importDateTime, client.id, slaBusinessDays);
        
        // Determine if this run is late, on-time, or not yet mailed
        let actualMailDate: string | null = null;
        let isOnTime: number | null = null;
        let approvalStatus: 'Pending' | 'Approved' | 'Rejected' | 'Unapproved' = 'Approved';
        let status: string = 'Mailed';
        let exceptionReason: string | null = null;
        
        // 85% of runs are mailed
        if (Math.random() > 0.15) {
          // For mailed runs, 92% are on-time, 8% are late
          const isLate = Math.random() > 0.92;
          
          if (isLate) {
            // Late by 1-3 business days
            const lateDays = Math.floor(Math.random() * 3) + 1;
            actualMailDate = format(addDays(parseISO(targetMailDate), lateDays), 'yyyy-MM-dd');
            isOnTime = 0;
            exceptionReason = [
              'QA reprint required',
              'Data file correction needed',
              'Client approval delay',
              'Printer malfunction',
              'Missing postal documentation'
            ][Math.floor(Math.random() * 5)];
          } else {
            // On time or early
            const earlyDays = Math.random() > 0.7 ? -1 : 0; // 30% are early
            actualMailDate = format(addDays(parseISO(targetMailDate), earlyDays), 'yyyy-MM-dd');
            isOnTime = 1;
          }
        } else {
          // Not yet mailed - could be pending approval or in progress
          if (daysAgo < 5) {
            approvalStatus = Math.random() > 0.6 ? 'Pending' : 'Approved';
            status = approvalStatus === 'Pending' ? 'QA Review' : 'Printing';
          } else if (daysAgo < 10) {
            approvalStatus = 'Approved';
            status = 'Exception';
            exceptionReason = 'Awaiting client confirmation';
          }
        }
        
        const totalRecords = Math.floor(Math.random() * 15000) + 5000; // 5K-20K records
        const totalPages = Math.floor(totalRecords * 2.5); // ~2.5 pages per record
        const costPerPage = 0.35;
        const totalCost = (totalPages * costPerPage).toFixed(2);
        
        const run: InsertProductionRun = {
          id: `pr-${runId}`,
          clientId: client.id,
          importBatchId: `BATCH-${format(importDateTime, 'yyyyMMdd')}-${String(runId).padStart(4, '0')}`,
          importDateTime: importDateTime.toISOString(),
          targetMailDate,
          actualMailDate,
          approvalStatus,
          approvedBy: approvalStatus === 'Approved' ? seedUsers[Math.floor(Math.random() * 3)].id : null,
          approvedAt: approvalStatus === 'Approved' ? addDays(importDateTime, Math.floor(Math.random() * 2)).toISOString() : null,
          isOnTime,
          exceptionReason,
          targetMailDateOverride: null,
          overrideReason: null,
          totalRecords,
          totalPages,
          totalCost,
          provider: client.provider,
          status,
          qaProofUrl: `/reports/qa-proof-${runId}.pdf`,
          reportsUrl: `/reports/batch-${runId}.pdf`,
          notes: exceptionReason ? `Exception: ${exceptionReason}` : null,
        };
        
        seedProductionRuns.push(run);
        
        // Create 1-4 production files per run
        const fileCount = Math.floor(Math.random() * 4) + 1;
        const documentCodes = ['BILL', 'NOTICE', 'SHUTOFF', 'REMINDER', 'STATEMENT'];
        const serviceTypes = client.utilityType === 'Multi-Service' 
          ? ['Water', 'Electric', 'Gas']
          : [client.utilityType];
        
        for (let f = 0; f < fileCount; f++) {
          const docCode = documentCodes[Math.floor(Math.random() * documentCodes.length)];
          const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
          const fileRecords = Math.floor(totalRecords / fileCount);
          const filePages = Math.floor(fileRecords * 2.5);
          const rejectedCount = Math.floor(Math.random() * fileRecords * 0.02); // 0-2% rejected
          
          // Determine file status based on run status
          let fileStatus = 'Mailed';
          let suppressionReason: string | null = null;
          
          if (status === 'Exception' || status === 'QA Review') {
            fileStatus = 'Not Processed';
          } else if (Math.random() > 0.95) {
            // 5% of files are suppressed
            fileStatus = 'Suppressed';
            suppressionReason = ['Duplicate records', 'Client hold', 'Data validation failed'][Math.floor(Math.random() * 3)];
          } else if (actualMailDate) {
            fileStatus = 'Mailed';
          } else {
            fileStatus = 'Printed';
          }
          
          seedProductionFiles.push({
            id: `pf-${fileId++}`,
            productionRunId: run.id,
            fileId: `${run.importBatchId}-${f + 1}`,
            dataFileName: `${client.code}_${docCode}_${format(importDateTime, 'yyyyMMdd')}_${f + 1}.dat`,
            documentCode: docCode,
            serviceType,
            totalDocuments: fileRecords,
            totalPages: filePages,
            rejectedCount,
            inputFileTotal: fileRecords + rejectedCount,
            status: fileStatus,
            printedBatchId: fileStatus !== 'Not Processed' ? `PRT-${runId}-${f + 1}` : null,
            mailedDate: actualMailDate,
            suppressionReason,
            notes: suppressionReason || null,
          });
        }
        
        runId++;
      }
    }
    
    await db.insert(productionRuns).values(seedProductionRuns);
    console.log(`   ✓ Created ${seedProductionRuns.length} production runs`);
    
    await db.insert(productionFiles).values(seedProductionFiles);
    console.log(`   ✓ Created ${seedProductionFiles.length} production files`);
    
    // 11. Link some call records to late production runs (mail delay complaints)
    console.log('   ⏳ Linking call records to production runs...');
    const lateRuns = seedProductionRuns.filter(r => r.isOnTime === 0);
    let linkedCallCount = 0;
    
    for (const lateRun of lateRuns.slice(0, Math.min(lateRuns.length, 15))) {
      // Create 1-2 call records for this late run
      const callsForRun = Math.floor(Math.random() * 2) + 1;
      
      for (let c = 0; c < callsForRun; c++) {
        const callDate = lateRun.actualMailDate 
          ? addDays(parseISO(lateRun.actualMailDate), Math.floor(Math.random() * 3))
          : new Date();
        
        const callHour = 8 + Math.floor(Math.random() * 9);
        const callMinute = Math.floor(Math.random() * 60);
        const startTime = new Date(callDate);
        startTime.setHours(callHour, callMinute, 0, 0);
        
        const handleTimeSeconds = Math.floor(Math.random() * 420) + 180; // 3-10 minutes
        const endTime = new Date(startTime.getTime() + handleTimeSeconds * 1000);
        
        const client = seedClients.find(cl => cl.id === lateRun.clientId);
        if (!client) continue;
        
        const mailDelayCall: InsertCallRecord = {
          id: `call-delay-${linkedCallCount++}`,
          clientId: lateRun.clientId,
          callerName: `Manager at ${client.name}`,
          callerPhone: client.contactPhone || '555-0000',
          callerEmail: client.contactEmail || 'contact@utility.com',
          contactChannel: 'phone',
          callReason: 'Mail Delay',
          subcategory: 'Late delivery inquiry',
          priority: 'High',
          status: 'Resolved',
          assignedTo: seedUsers[Math.floor(Math.random() * 3)].id,
          summary: `Inquiry about late ${lateRun.importBatchId} - ${lateRun.exceptionReason}`,
          detailedNotes: `Customer called regarding late mail delivery. Batch ${lateRun.importBatchId} was late due to: ${lateRun.exceptionReason}. Explained situation and provided updated timeline.`,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          handleTime: handleTimeSeconds,
          wrapUpTime: Math.floor(Math.random() * 120) + 30,
          disposition: 'resolved',
          resolutionCode: 'Exception explained, customer satisfied',
          resolutionLevel: 'Tier 2',
          firstContactResolution: 1,
          satisfactionScore: Math.floor(Math.random() * 2) + 3, // 3-4 score
          linkedActivityId: null,
          linkedProductionRunId: lateRun.id,
          escalatedTo: null,
          callbackDate: null,
          callbackNotes: null,
        };
        
        seedCallRecords.push(mailDelayCall);
      }
    }
    
    // Insert the linked call records for late runs
    if (linkedCallCount > 0) {
      const newCalls = seedCallRecords.slice(-linkedCallCount);
      await db.insert(callRecords).values(newCalls);
      console.log(`   ✓ Linked ${linkedCallCount} call records to late production runs`);
    }

    // 11b. Create call records for the first 10 "golden path" production runs
    console.log('   ⏳ Creating call records for golden path runs...');
    const goldenPathCalls: InsertCallRecord[] = [];
    
    for (let i = 0; i < 10; i++) {
      const run = seedProductionRuns[i];
      const client = seedClients.find(c => c.id === run.clientId);
      if (!client) continue;
      
      // Create 3-8 calls per golden path run
      const callCount = 3 + Math.floor(Math.random() * 6);
      const callReasons = ['Billing', 'General', 'Payment', 'Technical', 'Mail Delay'];
      
      for (let c = 0; c < callCount; c++) {
        const callDate = run.actualMailDate 
          ? addDays(parseISO(run.actualMailDate), Math.floor(Math.random() * 5))
          : subDays(new Date(), Math.floor(Math.random() * 7));
        
        const callHour = 8 + Math.floor(Math.random() * 9);
        const callMinute = Math.floor(Math.random() * 60);
        const startTime = new Date(callDate);
        startTime.setHours(callHour, callMinute, 0, 0);
        
        const handleTimeSeconds = Math.floor(Math.random() * 600) + 120;
        const endTime = new Date(startTime.getTime() + handleTimeSeconds * 1000);
        const reason = callReasons[Math.floor(Math.random() * callReasons.length)];
        const isResolved = Math.random() > 0.2;
        
        goldenPathCalls.push({
          id: `call-golden-${i}-${c}`,
          clientId: run.clientId,
          callerName: `Contact at ${client.name}`,
          callerPhone: client.contactPhone || `555-${String(i).padStart(4, '0')}`,
          callerEmail: client.contactEmail || `contact@${client.code.toLowerCase()}.com`,
          contactChannel: ['phone', 'email', 'chat'][Math.floor(Math.random() * 3)] as 'phone' | 'email' | 'chat',
          callReason: reason,
          subcategory: `${reason} inquiry`,
          priority: Math.random() > 0.7 ? 'High' : 'Medium',
          status: isResolved ? 'Resolved' : 'Open',
          assignedTo: seedUsers[Math.floor(Math.random() * 3)].id,
          summary: `${reason} inquiry - Batch ${run.importBatchId}`,
          detailedNotes: `Customer called regarding ${reason.toLowerCase()} for batch ${run.importBatchId}. ${isResolved ? 'Issue resolved.' : 'Working on resolution.'}`,
          startTime: startTime.toISOString(),
          endTime: isResolved ? endTime.toISOString() : null,
          handleTime: isResolved ? handleTimeSeconds : null,
          wrapUpTime: isResolved ? Math.floor(Math.random() * 120) + 30 : null,
          disposition: isResolved ? 'resolved' : null,
          resolutionCode: isResolved ? 'Issue resolved successfully' : null,
          resolutionLevel: 'Tier 1',
          firstContactResolution: isResolved ? 1 : 0,
          satisfactionScore: isResolved ? 4 + Math.floor(Math.random() * 2) : null,
          linkedActivityId: null,
          linkedProductionRunId: run.id,
          escalatedTo: null,
          callbackDate: null,
          callbackNotes: null,
        });
      }
    }
    
    if (goldenPathCalls.length > 0) {
      await db.insert(callRecords).values(goldenPathCalls);
      console.log(`   ✓ Created ${goldenPathCalls.length} call records for golden path runs`);
    }

    // 12. Seed Message Templates
    console.log('   ⏳ Seeding message templates...');
    const seedTemplates: InsertMessageTemplate[] = [
      { id: 'tpl-1', name: 'Standard Bill Message', category: 'Commercial', folder: 'Billing' },
      { id: 'tpl-2', name: 'Payment Reminder', category: 'Commercial', folder: 'Billing' },
      { id: 'tpl-3', name: 'Residential Water Notice', category: 'Residential', folder: 'Notices' },
      { id: 'tpl-4', name: 'Shutoff Warning', category: 'Residential', folder: 'Notices' },
      { id: 'tpl-5', name: 'Service Update', category: 'Commercial', folder: 'General' },
      { id: 'tpl-6', name: 'Holiday Schedule', category: 'Residential', folder: 'General' },
      { id: 'tpl-7', name: 'Rate Change Notice', category: 'Commercial', folder: 'Billing' },
      { id: 'tpl-8', name: 'Conservation Tips', category: 'Residential', folder: 'General' },
      { id: 'tpl-9', name: 'Auto-Pay Reminder', category: 'Commercial', folder: 'Billing' },
      { id: 'tpl-10', name: 'Survey Request', category: 'Residential', folder: 'General' },
    ];
    await db.insert(messageTemplates).values(seedTemplates);
    console.log(`   ✓ Created ${seedTemplates.length} message templates`);

    // 13. Seed Bill Messages (15 drafts/sent/published)
    console.log('   ⏳ Seeding bill messages...');
    const seedBillMessages: InsertBillMessage[] = [];
    for (let i = 0; i < 15; i++) {
      const template = seedTemplates[Math.floor(Math.random() * seedTemplates.length)];
      const client = seedClients[Math.floor(Math.random() * Math.min(30, seedClients.length))];
      const statusOptions = ['Draft', 'Sent to Approver', 'Approved', 'Published'];
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      const messageText = `Sample message text for ${client.name} - ${template.name}. This is a demo message that would appear on their utility bills.`;
      seedBillMessages.push({
        id: `msg-${i + 1}`,
        templateId: template.id,
        clientId: client.id,
        messageText,
        alignment: Math.random() > 0.5 ? 'Message Area' : 'Message Area Centered',
        fontFamily: ['Arial', 'Times New Roman', 'Courier'][Math.floor(Math.random() * 3)],
        charLimit: 500,
        exceedsLimit: messageText.length > 500 ? 1 : 0,
        status,
        createdBy: seedUsers[Math.floor(Math.random() * seedUsers.length)].id,
        approvedBy: status === 'Approved' || status === 'Published' ? seedUsers[0].id : null,
        approvedAt: status === 'Approved' || status === 'Published' ? subDays(new Date(), Math.floor(Math.random() * 10)).toISOString() : null,
        publishedAt: status === 'Published' ? subDays(new Date(), Math.floor(Math.random() * 5)).toISOString() : null,
      });
    }
    await db.insert(billMessages).values(seedBillMessages);
    console.log(`   ✓ Created ${seedBillMessages.length} bill messages`);

    // 14. Seed JobTrax Jobs (50 jobs) - First 10 are "golden path" with linked runs
    console.log('   ⏳ Seeding JobTrax jobs...');
    const seedJobs: InsertJob[] = [];
    
    // Create 10 golden path jobs linked to production runs
    for (let i = 0; i < 10; i++) {
      const run = seedProductionRuns[i]; // Link to first 10 production runs
      const client = seedClients.find(c => c.id === run.clientId) || seedClients[0];
      const startedAt = run.importDateTime;
      seedJobs.push({
        id: `job-${i + 1}`,
        jobNumber: `157579CA${String(i + 1).padStart(2, '0')}`,
        clientId: client.id,
        description: `${client.name} - Monthly Billing`,
        mailPieces: Math.floor(Math.random() * 15000) + 5000,
        startedAt,
        completedAt: run.actualMailDate ? new Date(run.actualMailDate).toISOString() : null,
        progressPercent: run.actualMailDate ? 100 : 75,
        targetMailDate: run.targetMailDate,
        actualMailDate: run.actualMailDate,
        status: run.actualMailDate ? 'Completed' : 'Mailstream',
        linkedProductionRunId: run.id,
        artifacts: JSON.stringify([
          `ClientReports_157579CA${String(i + 1).padStart(2, '0')}.txt`,
          `DPSYS_Report_157579CA${String(i + 1).padStart(2, '0')}.pdf`,
          `MU_Output_157579CA${String(i + 1).padStart(2, '0')}.dat`,
          `PostalDoc_157579CA${String(i + 1).padStart(2, '0')}.pdf`,
          `BillPreview_157579CA${String(i + 1).padStart(2, '0')}.pdf`,
        ]),
        notes: 'Golden path demo job with linked production run',
      });
    }
    
    // Create 40 additional regular jobs
    for (let i = 10; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 90);
      const client = seedClients[Math.floor(Math.random() * Math.min(50, seedClients.length))];
      const startedAt = subDays(new Date(), daysAgo);
      const statusOptions = ['Completed', 'Mailstream', 'Inserting', 'Imaging', 'Queued'];
      const status = daysAgo < 3 ? statusOptions[Math.floor(Math.random() * statusOptions.length)] : 'Completed';
      const progressPercent = status === 'Completed' ? 100 : status === 'Mailstream' ? 85 : status === 'Inserting' ? 60 : status === 'Imaging' ? 30 : 0;
      // Link some to production runs
      const linkedRun = i < 20 ? seedProductionRuns[i % seedProductionRuns.length] : null;
      seedJobs.push({
        id: `job-${i + 1}`,
        jobNumber: `JOB-${String(i + 1).padStart(6, '0')}`,
        clientId: linkedRun ? linkedRun.clientId : client.id,
        description: `${linkedRun ? seedClients.find(c => c.id === linkedRun.clientId)?.name : client.name} - Monthly Billing`,
        mailPieces: Math.floor(Math.random() * 15000) + 5000,
        startedAt: startedAt.toISOString(),
        completedAt: status === 'Completed' ? addDays(startedAt, Math.floor(Math.random() * 3) + 1).toISOString() : null,
        progressPercent,
        targetMailDate: format(addDays(startedAt, 3), 'yyyy-MM-dd'),
        actualMailDate: status === 'Completed' ? format(addDays(startedAt, Math.floor(Math.random() * 4) + 2), 'yyyy-MM-dd') : null,
        status,
        linkedProductionRunId: linkedRun?.id || null,
        artifacts: JSON.stringify([
          `ClientReports_JOB-${String(i + 1).padStart(6, '0')}.txt`,
          `DPSYS_Report_JOB-${String(i + 1).padStart(6, '0')}.pdf`,
        ]),
        notes: status === 'Completed' ? 'Job completed successfully' : null,
      });
    }
    await db.insert(jobs).values(seedJobs);
    console.log(`   ✓ Created ${seedJobs.length} JobTrax jobs (10 golden path)`);

    // 15. Seed eBill Sends (3 months for 30 municipalities)
    console.log('   ⏳ Seeding eBill sends...');
    const seedEBillSends: InsertEBillSend[] = [];
    const eBillClients = seedClients.slice(0, Math.min(30, seedClients.length));
    for (const client of eBillClients) {
      const sendsPerClient = Math.floor(Math.random() * 20) + 10; // 10-30 sends per client
      for (let s = 0; s < sendsPerClient; s++) {
        const daysAgo = Math.floor(Math.random() * 90);
        const sendDate = subDays(new Date(), daysAgo);
        const deliveryStatus = Math.random() > 0.9 ? 'Bounced' : Math.random() > 0.05 ? 'Delivered' : 'Pending';
        seedEBillSends.push({
          id: `ebill-${seedEBillSends.length + 1}`,
          clientId: client.id,
          accountNumber: `ACC-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
          recipientEmail: `customer${s}@${client.code.toLowerCase()}.com`,
          billDate: format(subDays(sendDate, 5), 'yyyy-MM-dd'),
          sendDate: sendDate.toISOString(),
          deliveryStatus,
          openedAt: deliveryStatus === 'Delivered' && Math.random() > 0.3 ? addDays(sendDate, Math.floor(Math.random() * 2)).toISOString() : null,
          billAmount: (Math.random() * 300 + 50).toFixed(2),
        });
      }
    }
    await db.insert(eBillSends).values(seedEBillSends);
    console.log(`   ✓ Created ${seedEBillSends.length} eBill sends`);

    // 16. Seed Recent Activity Events
    console.log('   ⏳ Seeding recent activity events...');
    const seedActivityEvents: InsertRecentActivityEvent[] = [];
    
    // Import events
    for (let i = 0; i < 30; i++) {
      const run = seedProductionRuns[Math.floor(Math.random() * Math.min(20, seedProductionRuns.length))];
      seedActivityEvents.push({
        id: `evt-import-${i + 1}`,
        timestamp: subDays(new Date(), Math.floor(Math.random() * 30)).toISOString(),
        eventType: 'import',
        description: `Data file imported for ${seedClients.find(c => c.id === run.clientId)?.name}`,
        userId: seedUsers[0].id,
        clientId: run.clientId,
        linkedEntityType: 'ProductionRun',
        linkedEntityId: run.id,
        metadata: JSON.stringify({}),
      });
    }

    // Approval events
    for (let i = 0; i < 20; i++) {
      const run = seedProductionRuns[Math.floor(Math.random() * seedProductionRuns.length)];
      if (run.approvalStatus === 'Approved') {
        seedActivityEvents.push({
          id: `evt-approval-${i + 1}`,
          timestamp: run.approvedAt ? run.approvedAt : subDays(new Date(), Math.floor(Math.random() * 20)).toISOString(),
          eventType: 'approval',
          description: `Production run approved for ${seedClients.find(c => c.id === run.clientId)?.name}`,
          userId: run.approvedBy || seedUsers[0].id,
          clientId: run.clientId,
          linkedEntityType: 'ProductionRun',
          linkedEntityId: run.id,
          metadata: JSON.stringify({}),
        });
      }
    }

    // Mail events
    for (let i = 0; i < 25; i++) {
      const run = seedProductionRuns[Math.floor(Math.random() * seedProductionRuns.length)];
      if (run.actualMailDate) {
        const pieces = Math.floor(Math.random() * 10000) + 5000;
        seedActivityEvents.push({
          id: `evt-mail-${i + 1}`,
          timestamp: new Date(run.actualMailDate).toISOString(),
          eventType: 'mail',
          description: `${pieces} pieces mailed for ${seedClients.find(c => c.id === run.clientId)?.name}`,
          userId: null,
          clientId: run.clientId,
          linkedEntityType: 'ProductionRun',
          linkedEntityId: run.id,
          metadata: JSON.stringify({ pieces }),
        });
      }
    }

    // Exception events
    const exceptionRuns = seedProductionRuns.filter(r => r.isOnTime === 0);
    for (let i = 0; i < Math.min(15, exceptionRuns.length); i++) {
      const run = exceptionRuns[i];
      seedActivityEvents.push({
        id: `evt-exception-${i + 1}`,
        timestamp: run.actualMailDate ? new Date(run.actualMailDate).toISOString() : new Date().toISOString(),
        eventType: 'exception',
        description: `Late mail exception: ${run.exceptionReason || 'Unknown reason'} - ${seedClients.find(c => c.id === run.clientId)?.name}`,
        userId: null,
        clientId: run.clientId,
        linkedEntityType: 'ProductionRun',
        linkedEntityId: run.id,
        metadata: JSON.stringify({ reason: run.exceptionReason }),
      });
    }

    await db.insert(recentActivityEvents).values(seedActivityEvents);
    console.log(`   ✓ Created ${seedActivityEvents.length} recent activity events`);

    // 17. Seed Confirmation Holds
    console.log('   ⏳ Seeding confirmation holds...');
    const seedConfirmationHolds: InsertConfirmationHold[] = [];
    const holdTypes = ['QA Review', 'Client Approval', 'Payment Hold', 'Data Verification', 'Manager Override'];
    const holdStatuses = ['Active', 'Released', 'Rejected', 'Expired'];
    const holdPriorities = ['Low', 'Normal', 'High', 'Critical'];
    const holdReasons = [
      'Missing rate code validation',
      'Client requested hold pending approval',
      'Payment discrepancy - awaiting resolution',
      'Address data incomplete',
      'Manager approval required for override',
      'QA found formatting issues',
      'Data file checksum mismatch',
      'Client billing cycle review',
      'Insert material verification needed',
      'SLA waiver pending authorization'
    ];

    // Create 25 active holds
    for (let i = 0; i < 25; i++) {
      const client = seedClients[Math.floor(Math.random() * Math.min(50, seedClients.length))];
      const run = seedProductionRuns[Math.floor(Math.random() * Math.min(30, seedProductionRuns.length))];
      const holdType = holdTypes[Math.floor(Math.random() * holdTypes.length)];
      const priority = i < 5 ? 'Critical' : i < 12 ? 'High' : holdPriorities[Math.floor(Math.random() * holdPriorities.length)];
      const daysAgo = Math.floor(Math.random() * 10);
      const dueDays = Math.floor(Math.random() * 5) + 1;
      
      seedConfirmationHolds.push({
        id: `hold-${i + 1}`,
        holdType,
        status: 'Active',
        priority,
        linkedEntityType: 'ProductionRun',
        linkedEntityId: run.id,
        clientId: client.id,
        holdReason: holdReasons[Math.floor(Math.random() * holdReasons.length)],
        holdDetails: `Hold placed on ${holdType.toLowerCase()} for batch ${run.importBatchId}. ${priority === 'Critical' ? 'URGENT: Requires immediate attention.' : 'Review and resolve before proceeding.'}`,
        requestedBy: seedUsers[Math.floor(Math.random() * seedUsers.length)].id,
        assignedTo: seedUsers[Math.floor(Math.random() * seedUsers.length)].id,
        holdStartedAt: subDays(new Date(), daysAgo).toISOString(),
        dueDate: addDays(subDays(new Date(), daysAgo), dueDays).toISOString(),
        affectedRecords: run.totalRecords,
        affectedValue: run.totalCost,
        escalationCount: priority === 'Critical' ? 2 : priority === 'High' ? 1 : 0,
      });
    }

    // Create 15 resolved holds (released)
    for (let i = 25; i < 40; i++) {
      const client = seedClients[Math.floor(Math.random() * Math.min(50, seedClients.length))];
      const run = seedProductionRuns[Math.floor(Math.random() * seedProductionRuns.length)];
      const holdType = holdTypes[Math.floor(Math.random() * holdTypes.length)];
      const daysAgo = Math.floor(Math.random() * 30) + 5;
      const resolvedDaysAgo = daysAgo - Math.floor(Math.random() * 3) - 1;
      
      seedConfirmationHolds.push({
        id: `hold-${i + 1}`,
        holdType,
        status: 'Released',
        priority: holdPriorities[Math.floor(Math.random() * holdPriorities.length)],
        linkedEntityType: 'ProductionRun',
        linkedEntityId: run.id,
        clientId: client.id,
        holdReason: holdReasons[Math.floor(Math.random() * holdReasons.length)],
        holdDetails: `Hold was successfully resolved and released.`,
        requestedBy: seedUsers[Math.floor(Math.random() * seedUsers.length)].id,
        assignedTo: seedUsers[Math.floor(Math.random() * seedUsers.length)].id,
        holdStartedAt: subDays(new Date(), daysAgo).toISOString(),
        dueDate: subDays(new Date(), daysAgo - 3).toISOString(),
        resolvedAt: subDays(new Date(), resolvedDaysAgo).toISOString(),
        resolvedBy: seedUsers[Math.floor(Math.random() * seedUsers.length)].id,
        resolution: 'Released',
        resolutionNotes: 'Issue resolved, proceeding with production.',
        affectedRecords: run.totalRecords,
        affectedValue: run.totalCost,
      });
    }

    // Create 5 rejected holds
    for (let i = 40; i < 45; i++) {
      const client = seedClients[Math.floor(Math.random() * Math.min(50, seedClients.length))];
      const run = seedProductionRuns[Math.floor(Math.random() * seedProductionRuns.length)];
      const holdType = holdTypes[Math.floor(Math.random() * holdTypes.length)];
      const daysAgo = Math.floor(Math.random() * 20) + 10;
      
      seedConfirmationHolds.push({
        id: `hold-${i + 1}`,
        holdType,
        status: 'Rejected',
        priority: holdPriorities[Math.floor(Math.random() * holdPriorities.length)],
        linkedEntityType: 'ProductionRun',
        linkedEntityId: run.id,
        clientId: client.id,
        holdReason: holdReasons[Math.floor(Math.random() * holdReasons.length)],
        holdDetails: `Hold request was rejected.`,
        requestedBy: seedUsers[Math.floor(Math.random() * seedUsers.length)].id,
        assignedTo: seedUsers[Math.floor(Math.random() * seedUsers.length)].id,
        holdStartedAt: subDays(new Date(), daysAgo).toISOString(),
        resolvedAt: subDays(new Date(), daysAgo - 1).toISOString(),
        resolvedBy: seedUsers[Math.floor(Math.random() * seedUsers.length)].id,
        resolution: 'Rejected',
        resolutionNotes: 'Hold request not valid - proceeding without hold.',
        affectedRecords: run.totalRecords,
        affectedValue: run.totalCost,
      });
    }

    await db.insert(confirmationHolds).values(seedConfirmationHolds);
    console.log(`   ✓ Created ${seedConfirmationHolds.length} confirmation holds (25 active, 15 released, 5 rejected)`);

    console.log('✅ Database seeded with comprehensive demo data');
    console.log(`   - ${seedUsers.length} users`);
    console.log(`   - ${seedClients.length} clients`);
    console.log(`   - ${seedMailRules.length} client mail rules`);
    console.log(`   - ${seedActivities.length + followUpActivities.length} activities`);
    console.log(`   - ${seedPrintJobs.length} print jobs (legacy)`);
    console.log(`   - ${seedProductionRuns.length} production runs`);
    console.log(`   - ${seedProductionFiles.length} production files`);
    console.log(`   - ${seedSurveys.length} surveys`);
    console.log(`   - ${seedCallRecords.length} call center records`);
    console.log(`   - ${seedTemplates.length} message templates`);
    console.log(`   - ${seedBillMessages.length} bill messages`);
    console.log(`   - ${seedJobs.length} JobTrax jobs`);
    console.log(`   - ${seedEBillSends.length} eBill sends`);
    console.log(`   - ${seedConfirmationHolds.length} confirmation holds`);
  }
}

export const storage = new DbStorage();
