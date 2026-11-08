import { errorFromUnknown, jsonOk } from "@/lib/api/http";
import {
  createConversation,
  listConversations,
} from "@/lib/db/conversations";
import type { ConversationKind } from "@/lib/db/types";
import { getProfile } from "@/lib/db/profile";
import { resolveModelId } from "@/lib/models/allowlist";

export const runtime = "nodejs";

function parseKind(value: unknown): ConversationKind | undefined {
  if (value === "icon" || value === "image" || value === "svg") return value;
  return undefined;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const source = params.get("source");
  const kind = parseKind(params.get("kind"));
  const items =
    source === "mcp" || source === "web"
      ? listConversations({ source, kind })
      : listConversations({ source: "web", kind });
  return jsonOk({ items });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      title?: string;
      model?: string;
      kind?: string;
    };
    const profile = getProfile();
    const conversation = createConversation({
      title: body.title,
      model: resolveModelId(body.model || profile.defaultModel),
      source: "web",
      kind: parseKind(body.kind) ?? "image",
    });
    return jsonOk(conversation, { status: 201 });
  } catch (err) {
    return errorFromUnknown(err);
  }
}
