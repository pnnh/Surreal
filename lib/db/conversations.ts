import { ulid } from "ulid";
import { getDb } from "./client";
import { listMessagesForConversation } from "./messages";
import type { Conversation, ConversationSource, Message } from "./types";

type Row = {
  id: string;
  title: string | null;
  model: string;
  source: ConversationSource;
  created_at: string;
  updated_at: string;
};

function mapRow(row: Row): Conversation {
  return {
    id: row.id,
    title: row.title,
    model: row.model,
    source: row.source === "mcp" ? "mcp" : "web",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listConversations(opts?: {
  source?: ConversationSource;
}): Conversation[] {
  if (opts?.source) {
    const rows = getDb()
      .prepare(
        `SELECT id, title, model, source, created_at, updated_at
         FROM conversations WHERE source = ? ORDER BY updated_at DESC`,
      )
      .all(opts.source) as Row[];
    return rows.map(mapRow);
  }
  const rows = getDb()
    .prepare(
      `SELECT id, title, model, source, created_at, updated_at
       FROM conversations ORDER BY updated_at DESC`,
    )
    .all() as Row[];
  return rows.map(mapRow);
}

export function getConversation(id: string): Conversation | null {
  const row = getDb()
    .prepare(
      `SELECT id, title, model, source, created_at, updated_at
       FROM conversations WHERE id = ?`,
    )
    .get(id) as Row | undefined;
  return row ? mapRow(row) : null;
}

export function createConversation(input?: {
  title?: string;
  model?: string;
  source?: ConversationSource;
}): Conversation {
  const id = ulid();
  const now = new Date().toISOString();
  const model = input?.model?.trim() || "GPT-Image-1.5";
  const title = input?.title?.trim() || null;
  const source = input?.source === "mcp" ? "mcp" : "web";
  getDb()
    .prepare(
      `INSERT INTO conversations (id, title, model, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(id, title, model, source, now, now);
  return getConversation(id)!;
}

export function touchConversation(
  id: string,
  patch?: { title?: string; model?: string },
) {
  const current = getConversation(id);
  if (!current) return null;
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE conversations
       SET title = ?, model = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      patch?.title !== undefined ? patch.title : current.title,
      patch?.model !== undefined ? patch.model : current.model,
      now,
      id,
    );
  return getConversation(id);
}

export function deleteConversation(id: string): boolean {
  const result = getDb()
    .prepare(`DELETE FROM conversations WHERE id = ?`)
    .run(id);
  return Number(result.changes) > 0;
}

export function getConversationDetail(
  id: string,
): (Conversation & { messages: Message[] }) | null {
  const conversation = getConversation(id);
  if (!conversation) return null;
  return { ...conversation, messages: listMessagesForConversation(id) };
}
