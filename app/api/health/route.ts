import { getEnv } from "@/lib/env";
import { jsonOk } from "@/lib/api/http";

export const runtime = "nodejs";

export async function GET() {
  const env = getEnv();
  return jsonOk({ ok: true, poeConfigured: env.poeConfigured });
}
