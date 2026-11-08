import { errorFromUnknown, jsonError, jsonOk } from "@/lib/api/http";
import { deleteAsset, getAsset } from "@/lib/db/assets";

export const runtime = "nodejs";

type Params = { params: Promise<{ assetId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { assetId } = await params;
  const asset = getAsset(assetId);
  if (!asset) return jsonError("NOT_FOUND", "Asset not found", 404);
  return jsonOk(asset);
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { assetId } = await params;
    const confirm = new URL(request.url).searchParams.get("confirm");
    if (confirm !== "true") {
      return jsonError("BAD_REQUEST", "confirm=true is required", 400);
    }
    const ok = await deleteAsset(assetId);
    if (!ok) return jsonError("NOT_FOUND", "Asset not found", 404);
    return new Response(null, { status: 204 });
  } catch (err) {
    return errorFromUnknown(err);
  }
}
