import { errorFromUnknown, jsonOk } from "@/lib/api/http";
import {
  createConversation,
  listConversations,
} from "@/lib/db/conversations";
import { getProfile } from "@/lib/db/profile";
import { resolveModelId } from "@/lib/models/allowlist";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const source = new URL(request.url).searchParams.get("source");
  const items =
    source === "mcp" || source === "web"
      ? listConversations({ source })
      : listConversations({ source: "web" });
  return jsonOk({ items });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      title?: string;
      model?: string;
    };
    const profile = getProfile();
    const conversation = createConversation({
      title: body.title,
      model: resolveModelId(body.model || profile.defaultModel),
      source: "web",
    });
    return jsonOk(conversation, { status: 201 });
  } catch (err) {
    return errorFromUnknown(err);
  }
}
