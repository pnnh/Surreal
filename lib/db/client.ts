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
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assets_favorite_created
  ON assets(favorite, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assets_conversation
  ON assets(conversation_id);
`;

export function getDb(): DatabaseSync {
  if (globalThis.__surrealDb) return globalThis.__surrealDb;

  const { dataDir } = getEnv();
  fs.mkdirSync(path.join(dataDir, "assets"), { recursive: true });
  const dbPath = path.join(dataDir, "surreal.sqlite");
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  migrateMessagesMeta(db);

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
