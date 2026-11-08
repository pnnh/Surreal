import { ulid } from "ulid";
import type { MessageMeta } from "@/lib/agents/types";
import { getDb } from "./client";
import { assetFileUrl, type Message, type MessageAssetSummary, type MessageRole } from "./types";

type Row = {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  model: string | null;
  sequence: number;
  created_at: string;
  meta_json: string | null;
};

function parseMeta(raw: string | null): Message["meta"] {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Message["meta"];
  } catch {
    return null;
  }
}

function mapRow(row: Row, assets: MessageAssetSummary[] = []): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    model: row.model,
    sequence: row.sequence,
    createdAt: row.created_at,
    assetIds: assets.map((a) => a.id),
    assets,
    meta: parseMeta(row.meta_json),
  };
}

function assetsForMessage(messageId: string): MessageAssetSummary[] {
  const rows = getDb()
    .prepare(
      `SELECT id, favorite, asset_type, mime_type FROM assets WHERE message_id = ?`,
    )
    .all(messageId) as {
    id: string;
    favorite: number;
    asset_type: string;
    mime_type: string;
  }[];
  return rows.map((r) => ({
    id: r.id,
    favorite: Boolean(r.favorite),
    fileUrl: assetFileUrl(r.id),
    assetType:
      r.asset_type === "icon" || r.asset_type === "svg"
        ? r.asset_type
        : "image",
    mimeType: r.mime_type,
  }));
}

export function listMessagesForConversation(conversationId: string): Message[] {
  const rows = getDb()
    .prepare(
      `SELECT id, conversation_id, role, content, model, sequence, created_at, meta_json
       FROM messages WHERE conversation_id = ? ORDER BY sequence ASC`,
    )
    .all(conversationId) as Row[];
  return rows.map((row) => mapRow(row, assetsForMessage(row.id)));
}

export function nextSequence(conversationId: string): number {
  const row = getDb()
    .prepare(
      `SELECT COALESCE(MAX(sequence), 0) AS max_seq FROM messages WHERE conversation_id = ?`,
    )
    .get(conversationId) as { max_seq: number };
  return Number(row.max_seq) + 1;
}

export function insertMessage(input: {
  conversationId: string;
  role: MessageRole;
  content: string;
  model?: string | null;
  meta?: MessageMeta | Message["meta"] | null;
}): Message {
  const id = ulid();
  const sequence = nextSequence(input.conversationId);
  const createdAt = new Date().toISOString();
  const metaJson = input.meta ? JSON.stringify(input.meta) : null;
  getDb()
    .prepare(
      `INSERT INTO messages (id, conversation_id, role, content, model, sequence, created_at, meta_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.conversationId,
      input.role,
      input.content,
      input.model ?? null,
      sequence,
      createdAt,
      metaJson,
    );
  return {
    id,
    conversationId: input.conversationId,
    role: input.role,
    content: input.content,
    model: input.model ?? null,
    sequence,
    createdAt,
    assetIds: [],
    assets: [],
    meta: input.meta ?? null,
  };
}

export function getRecentMessages(
  conversationId: string,
  limit: number,
): Message[] {
  const rows = getDb()
    .prepare(
      `SELECT id, conversation_id, role, content, model, sequence, created_at, meta_json
       FROM messages
       WHERE conversation_id = ? AND role IN ('user', 'assistant')
       ORDER BY sequence DESC
       LIMIT ?`,
    )
    .all(conversationId, limit) as Row[];
  return rows.reverse().map((row) => mapRow(row, assetsForMessage(row.id)));
}
