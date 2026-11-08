import { jsonOk } from "@/lib/api/http";
import { listAssets } from "@/lib/db/assets";
import type { AssetType } from "@/lib/db/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const favoriteParam = searchParams.get("favorite");
  const favorite =
    favoriteParam === null ? undefined : favoriteParam === "true";
  const typeParam = searchParams.get("type");
  const type: AssetType | undefined =
    typeParam === "image" || typeParam === "icon" || typeParam === "svg"
      ? typeParam
      : undefined;
  const limit = searchParams.get("limit");
  const cursor = searchParams.get("cursor") ?? undefined;
  const page = listAssets({
    favorite,
    type,
    limit: limit ? Number(limit) : undefined,
    cursor,
  });
  return jsonOk(page);
}
