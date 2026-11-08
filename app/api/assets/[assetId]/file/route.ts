import path from "node:path";
import { jsonError } from "@/lib/api/http";
import { getAsset } from "@/lib/db/assets";
import { getEnv } from "@/lib/env";
import { LocalFsStorage } from "@/lib/storage/local-fs";

export const runtime = "nodejs";

type Params = { params: Promise<{ assetId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { assetId } = await params;
  const asset = getAsset(assetId);
  if (!asset) return jsonError("NOT_FOUND", "Asset not found", 404);

  const storage = new LocalFsStorage(path.join(getEnv().dataDir, "assets"));
  const bytes = await storage.getObject(asset.storageKey);
  if (!bytes) return jsonError("NOT_FOUND", "Asset file missing", 404);

  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": asset.mimeType,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
