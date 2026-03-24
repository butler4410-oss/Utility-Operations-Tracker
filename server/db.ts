import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import * as schema from "@shared/schema";

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "utility-ops.db");

// Ensure directory exists
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// Auto-create tables if they don't exist
function initializeDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar TEXT
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      utility_type TEXT NOT NULL,
      state TEXT NOT NULL,
      status TEXT NOT NULL,
      provider TEXT NOT NULL,
      assigned_manager TEXT NOT NULL REFERENCES users(id),
      last_activity_date TEXT NOT NULL,
      contract_start_date TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      contact_email TEXT,
      contact_phone TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      owner_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL,
      effort_hours TEXT NOT NULL,
      outcome TEXT,
      value_score INTEGER NOT NULL,
      notes TEXT,
      attachment_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS client_mail_rules (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
      allowed_mail_days TEXT NOT NULL DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday"]',
      blackout_dates TEXT NOT NULL DEFAULT '[]',
      max_sla_business_days INTEGER NOT NULL DEFAULT 3,
      hard_deadline_day TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS production_runs (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      import_batch_id TEXT NOT NULL,
      import_date_time TEXT NOT NULL,
      target_mail_date TEXT NOT NULL,
      actual_mail_date TEXT,
      approval_status TEXT NOT NULL DEFAULT 'Pending',
      approved_by TEXT REFERENCES users(id),
      approved_at TEXT,
      is_on_time INTEGER,
      exception_reason TEXT,
      target_mail_date_override TEXT,
      override_reason TEXT,
      total_records INTEGER NOT NULL DEFAULT 0,
      total_pages INTEGER NOT NULL DEFAULT 0,
      total_cost TEXT NOT NULL DEFAULT '0',
      provider TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Imported',
      qa_proof_url TEXT,
      reports_url TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS production_files (
      id TEXT PRIMARY KEY,
      production_run_id TEXT NOT NULL REFERENCES production_runs(id) ON DELETE CASCADE,
      file_id TEXT NOT NULL,
      data_file_name TEXT NOT NULL,
      document_code TEXT NOT NULL,
      service_type TEXT,
      total_documents INTEGER NOT NULL DEFAULT 0,
      total_pages INTEGER NOT NULL DEFAULT 0,
      rejected_count INTEGER NOT NULL DEFAULT 0,
      input_file_total INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Not Processed',
      printed_batch_id TEXT,
      mailed_date TEXT,
      suppression_reason TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS print_jobs (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      pieces INTEGER NOT NULL,
      pages INTEGER NOT NULL,
      cost TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS surveys (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      score INTEGER NOT NULL,
      comments TEXT,
      linked_activity_id TEXT REFERENCES activities(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS call_records (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      caller_name TEXT,
      caller_phone TEXT,
      caller_email TEXT,
      contact_channel TEXT NOT NULL,
      call_reason TEXT NOT NULL,
      subcategory TEXT,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      summary TEXT NOT NULL,
      detailed_notes TEXT,
      assigned_to TEXT REFERENCES users(id),
      start_time TEXT NOT NULL,
      end_time TEXT,
      handle_time INTEGER,
      wrap_up_time INTEGER,
      disposition TEXT,
      resolution_code TEXT,
      resolution_level TEXT,
      first_contact_resolution INTEGER NOT NULL DEFAULT 0,
      satisfaction_score INTEGER,
      linked_activity_id TEXT REFERENCES activities(id),
      linked_production_run_id TEXT REFERENCES production_runs(id),
      escalated_to TEXT,
      callback_date TEXT,
      callback_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      job_number TEXT NOT NULL UNIQUE,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      mail_pieces INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      progress_percent INTEGER NOT NULL DEFAULT 0,
      target_mail_date TEXT,
      actual_mail_date TEXT,
      status TEXT NOT NULL,
      linked_production_run_id TEXT REFERENCES production_runs(id),
      artifacts TEXT NOT NULL DEFAULT '[]',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS message_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      folder TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bill_messages (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL REFERENCES message_templates(id) ON DELETE CASCADE,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      message_text TEXT NOT NULL,
      alignment TEXT NOT NULL DEFAULT 'Message Area',
      font_family TEXT NOT NULL DEFAULT 'Arial',
      char_limit INTEGER NOT NULL DEFAULT 500,
      exceeds_limit INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      created_by TEXT NOT NULL REFERENCES users(id),
      approved_by TEXT REFERENCES users(id),
      approved_at TEXT,
      rejection_reason TEXT,
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ebill_sends (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      account_number TEXT NOT NULL,
      recipient_email TEXT NOT NULL,
      bill_date TEXT NOT NULL,
      send_date TEXT NOT NULL,
      delivery_status TEXT NOT NULL,
      opened_at TEXT,
      bill_amount TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recent_activity_events (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      event_type TEXT NOT NULL,
      batch_id TEXT,
      description TEXT NOT NULL,
      user_id TEXT REFERENCES users(id),
      client_id TEXT REFERENCES clients(id),
      linked_entity_type TEXT,
      linked_entity_id TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS confirmation_holds (
      id TEXT PRIMARY KEY,
      hold_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active',
      priority TEXT NOT NULL DEFAULT 'Normal',
      linked_entity_type TEXT NOT NULL,
      linked_entity_id TEXT NOT NULL,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      hold_reason TEXT NOT NULL,
      hold_details TEXT,
      requested_by TEXT NOT NULL REFERENCES users(id),
      assigned_to TEXT REFERENCES users(id),
      hold_started_at TEXT NOT NULL DEFAULT (datetime('now')),
      due_date TEXT,
      resolved_at TEXT,
      resolved_by TEXT REFERENCES users(id),
      resolution TEXT,
      resolution_notes TEXT,
      affected_records INTEGER NOT NULL DEFAULT 0,
      affected_value TEXT,
      escalation_count INTEGER NOT NULL DEFAULT 0,
      auto_release_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

initializeDatabase();
