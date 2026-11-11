import path from "node:path";
import { ulid } from "ulid";
import { insertAsset } from "@/lib/db/assets";
import { getConversation } from "@/lib/db/conversations";
import type { Asset, AssetType } from "@/lib/db/types";
import { getEnv } from "@/lib/env";
import { buildAssetStorageKey } from "@/lib/storage/asset-path";
import { LocalFsStorage } from "@/lib/storage/local-fs";

function extFromMime(mime: string): string {
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "png";
}

function parseDataUrl(url: string): { mimeType: string; buffer: Buffer } | null {
  const match = /^data:(image\/[a-zA-Z+]+);base64,([\s\S]+)$/.exec(url);
  if (!match) return null;
  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

export async function downloadImageBytes(
  url: string,
): Promise<{ mimeType: string; buffer: Buffer }> {
  const data = parseDataUrl(url);
  if (data) return data;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download image (${res.status})`);
  }
  const mimeType = res.headers.get("content-type")?.split(";")[0] || "image/png";
  if (!mimeType.startsWith("image/")) {
    throw new Error(`Unexpected MIME type: ${mimeType}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength > 40 * 1024 * 1024) {
    throw new Error("Image exceeds 40MB limit");
  }
  return { mimeType, buffer };
}

export async function persistGeneratedImages(input: {
  urls: string[];
  conversationId: string;
  messageId: string;
  prompt: string;
  model: string;
  assetType?: AssetType;
  width?: number | null;
  height?: number | null;
}): Promise<Asset[]> {
  const env = getEnv();
  const assetsRoot = path.join(env.dataDir, "assets");
  const storage = new LocalFsStorage(assetsRoot);
  const assetType = input.assetType === "icon" ? "icon" : "image";
  const saved: Asset[] = [];

  const convTitle = getConversation(input.conversationId)?.title;

  for (const url of input.urls) {
    const { mimeType, buffer } = await downloadImageBytes(url);
    const assetId = ulid();
    const ext = extFromMime(mimeType);
    const storageKey = buildAssetStorageKey({
      conversationId: input.conversationId,
      assetType,
      assetId,
      ext,
      conversationTitle: convTitle,
      description: input.prompt,
    });
    try {
      await storage.putObject(storageKey, buffer, mimeType);
      const asset = insertAsset({
        id: assetId,
        conversationId: input.conversationId,
        messageId: input.messageId,
        prompt: input.prompt,
        model: input.model,
        mimeType,
        storageKey,
        width: input.width ?? null,
        height: input.height ?? null,
        assetType,
      });
      saved.push(asset);
    } catch (err) {
      await storage.deleteObject(storageKey).catch(() => undefined);
      throw err;
    }
  }

  return saved;
}
