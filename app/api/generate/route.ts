import { errorFromUnknown, jsonOk } from "@/lib/api/http";
import { runGeneration } from "@/lib/generation/run";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      conversationId?: string;
      prompt?: string;
      model?: string;
      source?: "confirm" | "skip";
      agentMessageId?: string;
      sizes?: number[];
    };

    if (!body.conversationId || !body.prompt?.trim()) {
      return errorFromUnknown(
        Object.assign(new Error("conversationId and prompt are required"), {
          code: "BAD_REQUEST",
        }),
      );
    }

    const source = body.source === "skip" ? "skip" : "confirm";
    if (!body.source) {
      return errorFromUnknown(
        Object.assign(
          new Error("source is required (confirm | skip)"),
          { code: "BAD_REQUEST" },
        ),
      );
    }

    const result = await runGeneration({
      conversationId: body.conversationId,
      prompt: body.prompt,
      model: body.model,
      recordUserMessage: true,
      userMessageContent:
        source === "confirm"
          ? `[Generate] ${body.prompt.trim().slice(0, 120)}`
          : body.prompt,
      source,
      sizes: Array.isArray(body.sizes) ? body.sizes : undefined,
    });

    return jsonOk({
      ...result,
      agentMessageId: body.agentMessageId ?? null,
    });
  } catch (err) {
    return errorFromUnknown(err);
  }
}
