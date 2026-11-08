import { jsonOk } from "@/lib/api/http";
import { getModelAllowlist } from "@/lib/models/allowlist";

export const runtime = "nodejs";

export async function GET() {
  return jsonOk(getModelAllowlist());
}
