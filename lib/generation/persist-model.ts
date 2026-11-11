import path from "node:path";
import { ulid } from "ulid";
import { insertAsset } from "@/lib/db/assets";
import type { Asset } from "@/lib/db/types";
import { getEnv } from "@/lib/env";
import { buildAssetStorageKey } from "@/lib/storage/asset-path";
import { LocalFsStorage } from "@/lib/storage/local-fs";

export async function persistModelAsset(input: {
  glbBuffer: Buffer;
  conversationId: string;
  messageId: string;
  prompt: string;
  model: string;
}): Promise<Asset> {
  const env = getEnv();
  const storage = new LocalFsStorage(path.join(env.dataDir, "assets"));
  const assetId = ulid();
  const storageKey = buildAssetStorageKey({
    conversationId: input.conversationId,
    assetType: "model",
    assetId,
    ext: "glb",
  });

  try {
    await storage.putObject(storageKey, input.glbBuffer, "model/gltf-binary");
    return insertAsset({
      id: assetId,
      conversationId: input.conversationId,
      messageId: input.messageId,
      prompt: input.prompt,
      model: input.model,
      mimeType: "model/gltf-binary",
      storageKey,
      assetType: "model",
    });
  } catch (err) {
    await storage.deleteObject(storageKey).catch(() => undefined);
    throw err;
  }
}

