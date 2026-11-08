import { errorFromUnknown, jsonError, jsonOk } from "@/lib/api/http";
import { setFavorite } from "@/lib/db/assets";

export const runtime = "nodejs";

type Params = { params: Promise<{ assetId: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const { assetId } = await params;
    const body = (await request.json()) as { favorite?: boolean };
    if (typeof body.favorite !== "boolean") {
      return jsonError("BAD_REQUEST", "favorite boolean required", 400);
    }
    const asset = setFavorite(assetId, body.favorite);
    if (!asset) return jsonError("NOT_FOUND", "Asset not found", 404);
    return jsonOk(asset);
  } catch (err) {
    return errorFromUnknown(err);
  }
}
