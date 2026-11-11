import { ulid } from "ulid";
import { getDb } from "./client";
import { listMessagesForConversation } from "./messages";
import type {
  Conversation,
  ConversationKind,
  ConversationSource,
  Message,
} from "./types";

type Row = {
  id: string;
  title: string | null;
  model: string;
  source: string;
  kind: string;
  active_task_id: string | null;
  created_at: string;
  updated_at: string;
};

function mapKind(kind: string | undefined): ConversationKind {
  if (kind === "icon") return "icon";
  if (kind === "svg") return "svg";
  if (kind === "image") return "image";
  return "general";
}

function mapRow(row: Row): Conversation {
  return {
    id: row.id,
    title: row.title,
    model: row.model,
    source: row.source === "mcp" ? "mcp" : "web",
    kind: mapKind(row.kind),
    activeTaskId: row.active_task_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_COLS = `id, title, model, source, kind, active_task_id, created_at, updated_at`;

export function listConversations(opts?: {
  source?: ConversationSource;
  kind?: ConversationKind;
}): Conversation[] {
  const clauses: string[] = [];
  const params: string[] = [];
  if (opts?.source) {
    clauses.push(`source = ?`);
    params.push(opts.source);
  }
  if (opts?.kind) {
    clauses.push(`kind = ?`);
    params.push(opts.kind);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = getDb()
    .prepare(
      `SELECT ${SELECT_COLS} FROM conversations ${where} ORDER BY updated_at DESC`,
    )
    .all(...params) as Row[];
  return rows.map(mapRow);
}

export function getConversation(id: string): Conversation | null {
  const row = getDb()
    .prepare(`SELECT ${SELECT_COLS} FROM conversations WHERE id = ?`)
    .get(id) as Row | undefined;
  return row ? mapRow(row) : null;
}

export function createConversation(input?: {
  title?: string;
  model?: string;
  source?: ConversationSource;
  kind?: ConversationKind;
}): Conversation {
  const id = ulid();
  const now = new Date().toISOString();
  const model = input?.model?.trim() || "GPT-Image-1.5";
  const title = input?.title?.trim() || null;
  const source = input?.source === "mcp" ? "mcp" : "web";
  const kind: ConversationKind = input?.kind ?? "general";
  getDb()
    .prepare(
      `INSERT INTO conversations (id, title, model, source, kind, active_task_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`,
    )
    .run(id, title, model, source, kind, now, now);
  return getConversation(id)!;
}

export function touchConversation(
  id: string,
  patch?: { title?: string; model?: string; activeTaskId?: string | null },
) {
  const current = getConversation(id);
  if (!current) return null;
  const now = new Date().toISOString();
  const newTitle = patch?.title !== undefined ? patch.title : current.title;
  const newModel = patch?.model !== undefined ? patch.model : current.model;
  const newActiveTaskId =
    patch?.activeTaskId !== undefined ? patch.activeTaskId : (current.activeTaskId ?? null);
  getDb()
    .prepare(
      `UPDATE conversations
       SET title = ?, model = ?, active_task_id = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(newTitle, newModel, newActiveTaskId, now, id);
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
