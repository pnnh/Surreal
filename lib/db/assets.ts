import { ulid } from "ulid";
import { getEnv } from "@/lib/env";
import { LocalFsStorage } from "@/lib/storage/local-fs";
import { getDb } from "./client";
import { assetFileUrl, type Asset, type AssetType } from "./types";

type Row = {
  id: string;
  conversation_id: string | null;
  message_id: string | null;
  prompt: string;
  model: string;
  mime_type: string;
  storage_key: string;
  width: number | null;
  height: number | null;
  favorite: number;
  asset_type: string;
  created_at: string;
};

function mapAssetType(value: string | undefined): AssetType {
  if (value === "icon") return "icon";
  if (value === "svg") return "svg";
  if (value === "model") return "model";
  return "image";
}

function mapRow(row: Row): Asset {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    messageId: row.message_id,
    prompt: row.prompt,
    model: row.model,
    mimeType: row.mime_type,
    storageKey: row.storage_key,
    width: row.width,
    height: row.height,
    favorite: Boolean(row.favorite),
    assetType: mapAssetType(row.asset_type),
    createdAt: row.created_at,
    fileUrl: assetFileUrl(row.id),
  };
}

const SELECT_COLS = `id, conversation_id, message_id, prompt, model, mime_type,
              storage_key, width, height, favorite, asset_type, created_at`;

export function insertAsset(input: {
  id?: string;
  conversationId: string | null;
  messageId: string | null;
  prompt: string;
  model: string;
  mimeType: string;
  storageKey: string;
  width?: number | null;
  height?: number | null;
  assetType?: AssetType;
}): Asset {
  const id = input.id ?? ulid();
  const createdAt = new Date().toISOString();
  const assetType: AssetType =
    input.assetType === "icon" ||
    input.assetType === "svg" ||
    input.assetType === "model"
      ? input.assetType
      : "image";
  getDb()
    .prepare(
      `INSERT INTO assets (
         id, conversation_id, message_id, prompt, model, mime_type,
         storage_key, width, height, favorite, asset_type, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    )
    .run(
      id,
      input.conversationId,
      input.messageId,
      input.prompt,
      input.model,
      input.mimeType,
      input.storageKey,
      input.width ?? null,
      input.height ?? null,
      assetType,
      createdAt,
    );
  return getAsset(id)!;
}

export function getAsset(id: string): Asset | null {
  const row = getDb()
    .prepare(`SELECT ${SELECT_COLS} FROM assets WHERE id = ?`)
    .get(id) as Row | undefined;
  return row ? mapRow(row) : null;
}

export function listAssets(opts?: {
  favorite?: boolean;
  type?: AssetType;
  limit?: number;
  cursor?: string;
}): { items: Asset[]; nextCursor: string | null } {
  const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 200);
  const params: unknown[] = [];
  let sql = `SELECT ${SELECT_COLS} FROM assets WHERE 1=1`;
  if (opts?.favorite === true) {
    sql += ` AND favorite = 1`;
  }
  if (opts?.type === "image" || opts?.type === "icon" || opts?.type === "svg") {
    sql += ` AND asset_type = ?`;
    params.push(opts.type);
  }
  if (opts?.cursor) {
    sql += ` AND created_at < ?`;
    params.push(opts.cursor);
  }
  sql += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(limit + 1);

  const rows = getDb().prepare(sql).all(...params) as Row[];
  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const items = slice.map(mapRow);
  const nextCursor = hasMore ? items[items.length - 1]?.createdAt ?? null : null;
  return { items, nextCursor };
}

export function setFavorite(id: string, favorite: boolean): Asset | null {
  const result = getDb()
    .prepare(`UPDATE assets SET favorite = ? WHERE id = ?`)
    .run(favorite ? 1 : 0, id);
  if (!Number(result.changes)) return null;
  return getAsset(id);
}

export async function deleteAsset(id: string): Promise<boolean> {
  const asset = getAsset(id);
  if (!asset) return false;
  const storage = new LocalFsStorage(`${getEnv().dataDir}/assets`);
  await storage.deleteObject(asset.storageKey);
  getDb().prepare(`DELETE FROM assets WHERE id = ?`).run(id);
  return true;
}
