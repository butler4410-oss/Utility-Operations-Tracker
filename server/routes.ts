import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { requireAuth, requireRole } from "./auth";
import { insertClientSchema, insertActivitySchema, insertPrintJobSchema, insertSurveySchema, insertCallRecordSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Seed on startup
  await storage.seed();

  // Users (authenticated)
  app.get("/api/users", requireAuth, async (req, res) => {
    const users = await storage.getUsers();
    // Strip passwords from response
    res.json(users.map(({ password, ...u }) => u));
  });

  // Clients
  app.get("/api/clients", requireAuth, async (req, res) => {
    const clients = await storage.getClients();
    res.json(clients);
  });

  app.get("/api/clients/:id", requireAuth, async (req, res) => {
    const client = await storage.getClient(req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  });

  app.post("/api/clients", requireRole('Admin', 'Manager'), async (req, res) => {
    try {
      const data = insertClientSchema.parse(req.body);
      const client = await storage.createClient(data);
      res.status(201).json(client);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/clients/:id", requireRole('Admin', 'Manager'), async (req, res) => {
    try {
      const allowed = insertClientSchema.partial().safeParse(req.body);
      if (!allowed.success) return res.status(400).json({ message: "Invalid data" });
      const client = await storage.updateClient(req.params.id, allowed.data);
      res.json(client);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/clients/:id", requireRole('Admin'), async (req, res) => {
    await storage.deleteClient(req.params.id);
    res.status(204).send();
  });

  // Activities
  app.get("/api/activities", requireAuth, async (req, res) => {
    const activities = await storage.getActivities();
    res.json(activities);
  });

  app.get("/api/activities/client/:clientId", requireAuth, async (req, res) => {
    const activities = await storage.getActivitiesByClient(req.params.clientId);
    res.json(activities);
  });

  app.post("/api/activities", requireRole('Admin', 'Manager', 'Analyst'), async (req, res) => {
    try {
      const data = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(data);
      res.status(201).json(activity);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/activities/:id", requireRole('Admin', 'Manager', 'Analyst'), async (req, res) => {
    try {
      const allowed = insertActivitySchema.partial().safeParse(req.body);
      if (!allowed.success) return res.status(400).json({ message: "Invalid data" });
      const activity = await storage.updateActivity(req.params.id, allowed.data);
      res.json(activity);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/activities/:id", requireRole('Admin', 'Manager'), async (req, res) => {
    await storage.deleteActivity(req.params.id);
    res.status(204).send();
  });

  // Print Jobs
  app.get("/api/print-jobs", requireAuth, async (req, res) => {
    const jobs = await storage.getPrintJobs();
    res.json(jobs);
  });

  app.get("/api/print-jobs/client/:clientId", requireAuth, async (req, res) => {
    const jobs = await storage.getPrintJobsByClient(req.params.clientId);
    res.json(jobs);
  });

  app.post("/api/print-jobs", requireRole('Admin', 'Manager'), async (req, res) => {
    try {
      const data = insertPrintJobSchema.parse(req.body);
      const job = await storage.createPrintJob(data);
      res.status(201).json(job);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/print-jobs/:id", requireRole('Admin', 'Manager'), async (req, res) => {
    try {
      const allowed = insertPrintJobSchema.partial().safeParse(req.body);
      if (!allowed.success) return res.status(400).json({ message: "Invalid data" });
      const job = await storage.updatePrintJob(req.params.id, allowed.data);
      res.json(job);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/print-jobs/:id", requireRole('Admin'), async (req, res) => {
    await storage.deletePrintJob(req.params.id);
    res.status(204).send();
  });

  // Surveys
  app.get("/api/surveys", requireAuth, async (req, res) => {
    const surveys = await storage.getSurveys();
    res.json(surveys);
  });

  app.get("/api/surveys/client/:clientId", requireAuth, async (req, res) => {
    const surveys = await storage.getSurveysByClient(req.params.clientId);
    res.json(surveys);
  });

  app.post("/api/surveys", requireRole('Admin', 'Manager', 'Analyst'), async (req, res) => {
    try {
      const data = insertSurveySchema.parse(req.body);
      const survey = await storage.createSurvey(data);
      res.status(201).json(survey);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/surveys/:id", requireRole('Admin', 'Manager', 'Analyst'), async (req, res) => {
    try {
      const allowed = insertSurveySchema.partial().safeParse(req.body);
      if (!allowed.success) return res.status(400).json({ message: "Invalid data" });
      const survey = await storage.updateSurvey(req.params.id, allowed.data);
      res.json(survey);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/surveys/:id", requireRole('Admin', 'Manager'), async (req, res) => {
    await storage.deleteSurvey(req.params.id);
    res.status(204).send();
  });

  // Call Records
  app.get("/api/call-records", requireAuth, async (req, res) => {
    const { status, assignedTo, clientId } = req.query;

    if (status) {
      const records = await storage.getCallRecordsByStatus(status as string);
      return res.json(records);
    }
    if (assignedTo) {
      const records = await storage.getCallRecordsByAssignee(assignedTo as string);
      return res.json(records);
    }
    if (clientId) {
      const records = await storage.getCallRecordsByClient(clientId as string);
      return res.json(records);
    }

    const records = await storage.getCallRecords();
    res.json(records);
  });

  app.get("/api/call-records/:id", requireAuth, async (req, res) => {
    const record = await storage.getCallRecord(req.params.id);
    if (!record) return res.status(404).json({ message: "Call record not found" });
    res.json(record);
  });

  app.post("/api/call-records", requireRole('Admin', 'Manager', 'Analyst'), async (req, res) => {
    try {
      const data = insertCallRecordSchema.parse(req.body);
      const record = await storage.createCallRecord(data);
      res.status(201).json(record);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/call-records/:id", requireRole('Admin', 'Manager', 'Analyst'), async (req, res) => {
    try {
      const allowed = insertCallRecordSchema.partial().safeParse(req.body);
      if (!allowed.success) return res.status(400).json({ message: "Invalid data" });
      const record = await storage.updateCallRecord(req.params.id, allowed.data);
      res.json(record);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/call-records/:id", requireRole('Admin', 'Manager'), async (req, res) => {
    await storage.deleteCallRecord(req.params.id);
    res.status(204).send();
  });

  // Production Runs
  app.get("/api/production-runs", requireAuth, async (req, res) => {
    const { clientId, approvalStatus } = req.query;

    if (clientId) {
      const runs = await storage.getProductionRunsByClient(clientId as string);
      return res.json(runs);
    }
    if (approvalStatus) {
      const runs = await storage.getProductionRunsByApprovalStatus(approvalStatus as string);
      return res.json(runs);
    }

    const runs = await storage.getProductionRuns();
    res.json(runs);
  });

  app.get("/api/production-runs/:id", requireAuth, async (req, res) => {
    const run = await storage.getProductionRun(req.params.id);
    if (!run) return res.status(404).json({ message: "Production run not found" });
    res.json(run);
  });

  app.post("/api/production-runs/:id/approve", requireRole('Admin', 'Manager'), async (req, res) => {
    try {
      const { approvedBy } = req.body;
      const run = await storage.approveProductionRun(req.params.id, approvedBy);
      res.json(run);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Production Files
  app.get("/api/production-files", requireAuth, async (req, res) => {
    const { runId } = req.query;
    if (runId) {
      const files = await storage.getProductionFilesByRun(runId as string);
      return res.json(files);
    }
    const files = await storage.getProductionFiles();
    res.json(files);
  });

  app.get("/api/production-files/:id", requireAuth, async (req, res) => {
    const file = await storage.getProductionFile(req.params.id);
    if (!file) return res.status(404).json({ message: "Production file not found" });
    res.json(file);
  });

  // Client Mail Rules
  app.get("/api/client-mail-rules", requireAuth, async (req, res) => {
    const rules = await storage.getClientMailRules();
    res.json(rules);
  });

  app.get("/api/client-mail-rules/:clientId", requireAuth, async (req, res) => {
    const rule = await storage.getClientMailRule(req.params.clientId);
    if (!rule) return res.status(404).json({ message: "Mail rule not found" });
    res.json(rule);
  });

  // Mail Compliance Stats
  app.get("/api/mail-compliance/stats", requireAuth, async (req, res) => {
    const stats = await storage.getMailComplianceStats();
    res.json(stats);
  });

  // JobTrax Jobs
  app.get("/api/jobs", requireAuth, async (req, res) => {
    const { clientId } = req.query;
    if (clientId) {
      const jobs = await storage.getJobsByClient(clientId as string);
      return res.json(jobs);
    }
    const jobs = await storage.getJobs();
    res.json(jobs);
  });

  app.get("/api/jobs/:id", requireAuth, async (req, res) => {
    const job = await storage.getJob(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  });

  app.post("/api/jobs", requireRole('Admin', 'Manager'), async (req, res) => {
    try {
      const job = await storage.createJob(req.body);
      res.status(201).json(job);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/jobs/:id", requireRole('Admin', 'Manager'), async (req, res) => {
    try {
      const job = await storage.updateJob(req.params.id, req.body);
      res.json(job);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Message Templates
  app.get("/api/message-templates", requireAuth, async (req, res) => {
    const templates = await storage.getMessageTemplates();
    res.json(templates);
  });

  // Bill Messages
  app.get("/api/bill-messages", requireAuth, async (req, res) => {
    const { status } = req.query;
    if (status) {
      const messages = await storage.getBillMessagesByStatus(status as string);
      return res.json(messages);
    }
    const messages = await storage.getBillMessages();
    res.json(messages);
  });

  app.get("/api/bill-messages/:id", requireAuth, async (req, res) => {
    const message = await storage.getBillMessage(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found" });
    res.json(message);
  });

  app.post("/api/bill-messages", requireRole('Admin', 'Manager', 'Analyst'), async (req, res) => {
    try {
      const message = await storage.createBillMessage(req.body);
      res.status(201).json(message);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/bill-messages/:id/approve", requireRole('Admin', 'Manager'), async (req, res) => {
    try {
      const { approvedBy } = req.body;
      const message = await storage.approveBillMessage(req.params.id, approvedBy);
      res.json(message);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/bill-messages/:id/reject", requireRole('Admin', 'Manager'), async (req, res) => {
    try {
      const { reason } = req.body;
      const message = await storage.rejectBillMessage(req.params.id, reason);
      res.json(message);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // eBill Sends
  app.get("/api/ebill-sends", requireAuth, async (req, res) => {
    const { clientId } = req.query;
    if (clientId) {
      const sends = await storage.getEBillSendsByClient(clientId as string);
      return res.json(sends);
    }
    const sends = await storage.getEBillSends();
    res.json(sends);
  });

  app.get("/api/ebill-stats", requireAuth, async (req, res) => {
    const stats = await storage.getEBillStats();
    res.json(stats);
  });

  // Recent Activity Events
  app.get("/api/recent-activity", requireAuth, async (req, res) => {
    const { limit } = req.query;
    const events = await storage.getRecentActivityEvents(limit ? parseInt(limit as string) : 100);
    res.json(events);
  });

  app.post("/api/recent-activity", requireRole('Admin', 'Manager', 'Analyst'), async (req, res) => {
    try {
      const event = await storage.createActivityEvent(req.body);
      res.status(201).json(event);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Confirmation Holds
  app.get("/api/confirmation-holds", requireAuth, async (req, res) => {
    const { status, clientId } = req.query;
    if (status) {
      const holds = await storage.getConfirmationHoldsByStatus(status as string);
      return res.json(holds);
    }
    if (clientId) {
      const holds = await storage.getConfirmationHoldsByClient(clientId as string);
      return res.json(holds);
    }
    const holds = await storage.getConfirmationHolds();
    res.json(holds);
  });

  app.get("/api/confirmation-holds/stats", requireAuth, async (req, res) => {
    const stats = await storage.getConfirmationHoldsStats();
    res.json(stats);
  });

  app.get("/api/confirmation-holds/:id", requireAuth, async (req, res) => {
    const hold = await storage.getConfirmationHold(req.params.id);
    if (!hold) return res.status(404).json({ message: "Hold not found" });
    res.json(hold);
  });

  app.post("/api/confirmation-holds", requireRole('Admin', 'Manager'), async (req, res) => {
    try {
      const hold = await storage.createConfirmationHold(req.body);
      res.status(201).json(hold);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/confirmation-holds/:id", requireRole('Admin', 'Manager'), async (req, res) => {
    try {
      const hold = await storage.updateConfirmationHold(req.params.id, req.body);
      res.json(hold);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/confirmation-holds/:id/release", requireRole('Admin', 'Manager'), async (req, res) => {
    try {
      const { resolvedBy, notes } = req.body;
      const hold = await storage.releaseConfirmationHold(req.params.id, resolvedBy, notes);
      res.json(hold);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/confirmation-holds/:id/reject", requireRole('Admin', 'Manager'), async (req, res) => {
    try {
      const { resolvedBy, notes } = req.body;
      const hold = await storage.rejectConfirmationHold(req.params.id, resolvedBy, notes);
      res.json(hold);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Cost Comparison (eBill vs Print)
  app.get("/api/cost-comparison", requireAuth, async (req, res) => {
    try {
      const clients = await storage.getClients();
      const printJobs = await storage.getPrintJobs();
      const eBillSends = await storage.getEBillSends();

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = clients.map(client => {
        const clientPrintJobs = printJobs.filter(j =>
          j.clientId === client.id && new Date(j.date) >= thirtyDaysAgo
        );
        const clientEBillSends = eBillSends.filter(e =>
          e.clientId === client.id && new Date(e.sendDate) >= thirtyDaysAgo
        );

        const printPieces = clientPrintJobs.reduce((sum, j) => sum + (j.pieces || 0), 0);
        const printCost = clientPrintJobs.reduce((sum, j) => sum + (typeof j.cost === 'string' ? parseFloat(j.cost) : (j.cost || 0)), 0);
        const eBillCount = clientEBillSends.length;
        const estEBillCost = eBillCount * 0.15;
        const estPrintEquivCost = eBillCount * 0.85;
        const savings = estPrintEquivCost - estEBillCost;
        const savingsPercent = estPrintEquivCost > 0 ? (savings / estPrintEquivCost) * 100 : 0;

        return {
          clientId: client.id,
          clientName: client.name,
          printPieces,
          printCost: Math.round(printCost * 100) / 100,
          eBillSends: eBillCount,
          estEBillCost: Math.round(estEBillCost * 100) / 100,
          estPrintEquivCost: Math.round(estPrintEquivCost * 100) / 100,
          savings: Math.round(savings * 100) / 100,
          savingsPercent: Math.round(savingsPercent * 10) / 10,
        };
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin
  app.get("/api/admin/status", requireRole('Admin'), async (req, res) => {
    const status = await storage.getDataStatus();
    res.json(status);
  });

  app.post("/api/admin/reset", requireRole('Admin'), async (req, res) => {
    await storage.resetData();
    res.json({ message: "Data reset successfully" });
  });

  return httpServer;
}
