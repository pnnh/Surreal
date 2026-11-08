import { jsonOk } from "@/lib/api/http";
import { listAssets } from "@/lib/db/assets";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const favoriteParam = searchParams.get("favorite");
  const favorite =
    favoriteParam === null ? undefined : favoriteParam === "true";
  const limit = searchParams.get("limit");
  const cursor = searchParams.get("cursor") ?? undefined;
  const page = listAssets({
    favorite,
    limit: limit ? Number(limit) : undefined,
    cursor,
  });
  return jsonOk(page);
}
