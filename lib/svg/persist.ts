import path from "node:path";
import { ulid } from "ulid";
import { insertAsset } from "@/lib/db/assets";
import { getConversation } from "@/lib/db/conversations";
import type { Asset } from "@/lib/db/types";
import { getEnv } from "@/lib/env";
import { buildAssetStorageKey } from "@/lib/storage/asset-path";
import { LocalFsStorage } from "@/lib/storage/local-fs";

export async function persistSvgAsset(input: {
  svg: string;
  conversationId: string;
  messageId: string;
  prompt: string;
  model: string;
}): Promise<Asset> {
  const env = getEnv();
  const storage = new LocalFsStorage(path.join(env.dataDir, "assets"));
  const assetId = ulid();
  const convTitle = getConversation(input.conversationId)?.title;
  const storageKey = buildAssetStorageKey({
    conversationId: input.conversationId,
    assetType: "svg",
    assetId,
    ext: "svg",
    conversationTitle: convTitle,
    description: input.prompt,
  });
  const buffer = Buffer.from(input.svg, "utf8");

  try {
    await storage.putObject(storageKey, buffer, "image/svg+xml");
    return insertAsset({
      id: assetId,
      conversationId: input.conversationId,
      messageId: input.messageId,
      prompt: input.prompt,
      model: input.model,
      mimeType: "image/svg+xml",
      storageKey,
      assetType: "svg",
    });
  } catch (err) {
    await storage.deleteObject(storageKey).catch(() => undefined);
    throw err;
  }
}
