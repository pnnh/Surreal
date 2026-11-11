import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getEnv } from "@/lib/env";

declare global {
  var __surrealDb: DatabaseSync | undefined;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS generation_profile (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  system_prompt TEXT NOT NULL DEFAULT '',
  default_model TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  title TEXT,
  model TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'web',
  kind TEXT NOT NULL DEFAULT 'image',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model TEXT,
  sequence INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  meta_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_seq
  ON messages(conversation_id, sequence);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  conversation_id TEXT,
  message_id TEXT,
  prompt TEXT NOT NULL,
  model TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  favorite INTEGER NOT NULL DEFAULT 0,
  asset_type TEXT NOT NULL DEFAULT 'image',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assets_favorite_created
  ON assets(favorite, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assets_conversation
  ON assets(conversation_id);

CREATE INDEX IF NOT EXISTS idx_assets_type_created
  ON assets(asset_type, created_at DESC);

CREATE TABLE IF NOT EXISTS subagent_tasks (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  subagent_type TEXT NOT NULL,
  status TEXT NOT NULL,
  clarifying_questions TEXT NOT NULL DEFAULT '[]',
  suggested_prompt TEXT NOT NULL DEFAULT '',
  suggested_sizes TEXT NOT NULL DEFAULT '[]',
  asset_ids TEXT NOT NULL DEFAULT '[]',
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_conversation_id
  ON subagent_tasks(conversation_id);

CREATE INDEX IF NOT EXISTS idx_tasks_status
  ON subagent_tasks(status);
`;

function runMigrations(db: DatabaseSync): void {
  db.exec(SCHEMA);
  migrateMessagesMeta(db);
  migrateConversationSource(db);
  migrateConversationKind(db);
  migrateConversationActiveTask(db);
  migrateAssetType(db);
}

export function getDb(): DatabaseSync {
  // Always re-run idempotent migrations: Turbopack HMR can keep a cached
  // DatabaseSync from before new columns existed.
  if (globalThis.__surrealDb) {
    runMigrations(globalThis.__surrealDb);
    return globalThis.__surrealDb;
  }

  const { dataDir } = getEnv();
  fs.mkdirSync(path.join(dataDir, "assets"), { recursive: true });
  const dbPath = path.join(dataDir, "surreal.sqlite");
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON;");
  runMigrations(db);

  const row = db
    .prepare("SELECT id FROM generation_profile WHERE id = 'default'")
    .get() as { id: string } | undefined;
  if (!row) {
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO generation_profile (id, system_prompt, default_model, updated_at)
       VALUES ('default', '', 'GPT-Image-1.5', ?)`,
    ).run(now);
  }

  globalThis.__surrealDb = db;
  return db;
}

function migrateMessagesMeta(db: DatabaseSync): void {
  const cols = db.prepare(`PRAGMA table_info(messages)`).all() as Array<{
    name: string;
  }>;
  if (!cols.some((c) => c.name === "meta_json")) {
    db.exec(`ALTER TABLE messages ADD COLUMN meta_json TEXT`);
  }
}

function migrateConversationSource(db: DatabaseSync): void {
  const cols = db.prepare(`PRAGMA table_info(conversations)`).all() as Array<{
    name: string;
  }>;
  if (!cols.some((c) => c.name === "source")) {
    db.exec(
      `ALTER TABLE conversations ADD COLUMN source TEXT NOT NULL DEFAULT 'web'`,
    );
  }
}

function migrateConversationKind(db: DatabaseSync): void {
  const cols = db.prepare(`PRAGMA table_info(conversations)`).all() as Array<{
    name: string;
  }>;
  if (!cols.some((c) => c.name === "kind")) {
    db.exec(
      `ALTER TABLE conversations ADD COLUMN kind TEXT NOT NULL DEFAULT 'image'`,
    );
  }
}

function migrateConversationActiveTask(db: DatabaseSync): void {
  const cols = db.prepare(`PRAGMA table_info(conversations)`).all() as Array<{
    name: string;
  }>;
  if (!cols.some((c) => c.name === "active_task_id")) {
    db.exec(`ALTER TABLE conversations ADD COLUMN active_task_id TEXT`);
  }
}

function migrateAssetType(db: DatabaseSync): void {
  const cols = db.prepare(`PRAGMA table_info(assets)`).all() as Array<{
    name: string;
  }>;
  if (!cols.some((c) => c.name === "asset_type")) {
    db.exec(
      `ALTER TABLE assets ADD COLUMN asset_type TEXT NOT NULL DEFAULT 'image'`,
    );
  }
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_assets_type_created
     ON assets(asset_type, created_at DESC)`,
  );
}
