import { errorFromUnknown, jsonError, jsonOk } from "@/lib/api/http";
import {
  deleteConversation,
  getConversationDetail,
} from "@/lib/db/conversations";

export const runtime = "nodejs";

type Params = { params: Promise<{ conversationId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { conversationId } = await params;
  const detail = getConversationDetail(conversationId);
  if (!detail) return jsonError("NOT_FOUND", "Conversation not found", 404);
  return jsonOk(detail);
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { conversationId } = await params;
    const ok = deleteConversation(conversationId);
    if (!ok) return jsonError("NOT_FOUND", "Conversation not found", 404);
    return new Response(null, { status: 204 });
  } catch (err) {
    return errorFromUnknown(err);
  }
}
