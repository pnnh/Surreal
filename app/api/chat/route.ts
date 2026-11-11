import { runCoordinatorTurn } from "@/lib/agents/coordinator/run-coordinator-turn";
import { detectsSkipClarification } from "@/lib/agents/detect-skip";
import { runAgentTurn } from "@/lib/agents/run-agent-turn";
import type { AgentMessageMeta } from "@/lib/agents/types";
import { errorFromUnknown, jsonOk } from "@/lib/api/http";
import {
  getConversation,
  touchConversation,
} from "@/lib/db/conversations";
import { insertMessage } from "@/lib/db/messages";
import { updateSubagentTask } from "@/lib/db/tasks";
import type { AssetType } from "@/lib/db/types";
import { runGeneration } from "@/lib/generation/run";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      conversationId?: string;
      prompt?: string;
      skipClarification?: boolean;
      locale?: "en" | "zh";
      model?: string;
    };

    if (!body.conversationId || !body.prompt?.trim()) {
      return errorFromUnknown(
        Object.assign(new Error("conversationId and prompt are required"), {
          code: "BAD_REQUEST",
        }),
      );
    }

    const conversation = getConversation(body.conversationId);
    if (!conversation) {
      return errorFromUnknown(
        Object.assign(new Error("Conversation not found"), { code: "NOT_FOUND" }),
      );
    }

    const prompt = body.prompt.trim();
    const forceSkip =
      Boolean(body.skipClarification) || detectsSkipClarification(prompt);
    const locale = body.locale === "zh" ? "zh" : "en";

    const userMessage = insertMessage({
      conversationId: conversation.id,
      role: "user",
      content: prompt,
      meta: { kind: "user", skipClarification: forceSkip },
    });

    if (!conversation.title) {
      touchConversation(conversation.id, { title: prompt.slice(0, 80) });
    } else {
      touchConversation(conversation.id, {});
    }

    // 1. General conversation routed via Coordinator-Subagent pipeline
    if (conversation.kind === "general") {
      const { meta, task, agentModel } = await runCoordinatorTurn({
        conversationId: conversation.id,
        userPrompt: prompt,
        locale,
        forceSkip,
      });

      const assistantMessage = insertMessage({
        conversationId: conversation.id,
        role: "assistant",
        content:
          meta.assistantMessage ||
          (locale === "zh"
            ? "已收到，正在协同处理。"
            : "Received, coordinating with specialist."),
        model: agentModel,
        meta,
      });

      let generated: Awaited<ReturnType<typeof runGeneration>> | null = null;
      if (
        forceSkip &&
        meta.readyToGenerate &&
        meta.suggestedPrompt?.trim() &&
        task
      ) {
        generated = await runGeneration({
          conversationId: conversation.id,
          prompt: meta.suggestedPrompt.trim(),
          model: body.model || conversation.model,
          recordUserMessage: false,
          source: "skip",
          sizes: task.subagentType === "icon" ? meta.suggestedSizes : undefined,
          assetType:
            task.subagentType === "3d" || task.subagentType === "model"
              ? "model"
              : (task.subagentType as AssetType),
          modelCategory: task.modelCategory ?? meta.modelCategory,
          modelStyle: task.modelStyle ?? meta.modelStyle,
        });

        if (generated.assets.length > 0) {
          updateSubagentTask(task.id, {
            status: "completed",
            assetIds: generated.assets.map((a) => a.id),
          });
        }
      }

      return jsonOk({
        userMessage,
        assistantMessage: {
          ...assistantMessage,
          meta,
        },
        agent: meta,
        task,
        generated: generated
          ? {
              assistantMessage: generated.assistantMessage,
              assets: generated.assets,
            }
          : null,
      });
    }

    // 2. Legacy dedicated conversation kinds (image, icon, svg)
    const { reply, agentModel } = await runAgentTurn({
      conversationId: conversation.id,
      userPrompt: prompt,
      locale,
      forceSkip,
      kind: conversation.kind,
    });

    const meta: AgentMessageMeta = {
      kind: "agent_reply",
      ...reply,
      agentModel,
    };

    const assistantMessage = insertMessage({
      conversationId: conversation.id,
      role: "assistant",
      content: reply.assistantMessage,
      model: agentModel,
      meta,
    });

    let generated: Awaited<ReturnType<typeof runGeneration>> | null = null;
    if (forceSkip && reply.readyToGenerate && reply.suggestedPrompt.trim()) {
      generated = await runGeneration({
        conversationId: conversation.id,
        prompt: reply.suggestedPrompt.trim(),
        model: body.model || conversation.model,
        recordUserMessage: false,
        source: "skip",
        sizes:
          conversation.kind === "icon" ? reply.suggestedSizes : undefined,
      });
    }

    return jsonOk({
      userMessage,
      assistantMessage: {
        ...assistantMessage,
        meta,
      },
      agent: meta,
      generated: generated
        ? {
            assistantMessage: generated.assistantMessage,
            assets: generated.assets,
          }
        : null,
    });
  } catch (err) {
    return errorFromUnknown(err);
  }
}
