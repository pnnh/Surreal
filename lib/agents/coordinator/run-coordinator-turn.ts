import OpenAI from "openai";
import { getProfile } from "@/lib/db/profile";
import {
  createSubagentTask,
  getActiveSubagentTask,
  updateSubagentTask,
} from "@/lib/db/tasks";
import type { SubagentTask, SubagentType } from "@/lib/db/types";
import { getEnv, requirePoeApiKey } from "@/lib/env";
import { runIconSpecialistTurn } from "../subagents/icon-specialist";
import { runImageSpecialistTurn } from "../subagents/image-specialist";
import { runSvgSpecialistTurn } from "../subagents/svg-specialist";
import type { AgentReply, CoordinatorMessageMeta, SubagentInput } from "../types";
import { buildContextSummary } from "./context-builder";
import {
  buildCoordinatorSystemPrompt,
  fallbackCoordinatorIntent,
  parseCoordinatorIntentJson,
} from "./intent-prompt";

export type CoordinatorTurnResult = {
  meta: CoordinatorMessageMeta;
  task: SubagentTask | null;
  agentModel: string;
};

function isCancelCommand(text: string): boolean {
  return /^(cancel|取消|放弃|不要了|换一个|算了|stop|reset)$/i.test(text.trim());
}

async function dispatchToSpecialist(
  subagentType: SubagentType,
  input: SubagentInput,
): Promise<{ reply: AgentReply; agentModel: string }> {
  switch (subagentType) {
    case "icon":
      return runIconSpecialistTurn(input);
    case "svg":
      return runSvgSpecialistTurn(input);
    case "image":
    default:
      return runImageSpecialistTurn(input);
  }
}

export async function runCoordinatorTurn(input: {
  conversationId: string;
  userPrompt: string;
  locale: "en" | "zh";
  forceSkip: boolean;
}): Promise<CoordinatorTurnResult> {
  const env = getEnv();
  if (!env.poeConfigured) {
    throw Object.assign(new Error("POE_API_KEY is not configured"), {
      code: "POE_NOT_CONFIGURED",
    });
  }

  const agentModel = env.agentModel;
  const activeTask = getActiveSubagentTask(input.conversationId);

  // 1. Fast-Path: If there is an active task in grill, route directly to that specialist
  if (activeTask && activeTask.status === "in_grill") {
    if (isCancelCommand(input.userPrompt)) {
      updateSubagentTask(activeTask.id, { status: "cancelled" });
      const cancelMsg =
        input.locale === "zh"
          ? "已为你取消该生成任务。还有什么想创作或聊聊的吗？"
          : "Cancelled the active generation task. What else would you like to create or talk about?";
      return {
        meta: {
          kind: "coordinator_reply",
          intent: "task_update",
          subagentType: activeTask.subagentType,
          taskId: activeTask.id,
          taskStatus: "cancelled",
          assistantMessage: cancelMsg,
          agentModel,
        },
        task: null,
        agentModel,
      };
    }

    // Direct forward to the specialist
    const specialistInput: SubagentInput = {
      taskId: activeTask.id,
      conversationId: input.conversationId,
      subagentType: activeTask.subagentType,
      userPrompt: input.userPrompt,
      contextSummary: activeTask.suggestedPrompt,
      locale: input.locale,
      forceSkip: input.forceSkip,
    };

    const { reply, agentModel: subModel } = await dispatchToSpecialist(
      activeTask.subagentType,
      specialistInput,
    );

    const nextStatus = reply.readyToGenerate ? "ready" : "in_grill";
    const updated = updateSubagentTask(activeTask.id, {
      status: nextStatus,
      clarifyingQuestions: reply.clarifyingQuestions,
      suggestedPrompt: reply.suggestedPrompt,
      suggestedSizes: reply.suggestedSizes,
    });

    return {
      meta: {
        kind: "coordinator_reply",
        intent: "task_update",
        assistantMessage: reply.assistantMessage,
        subagentType: activeTask.subagentType,
        taskId: activeTask.id,
        taskStatus: nextStatus,
        clarifyingQuestions: reply.clarifyingQuestions,
        suggestedPrompt: reply.suggestedPrompt,
        suggestedSizes: reply.suggestedSizes,
        readyToGenerate: reply.readyToGenerate,
        agentModel: subModel,
      },
      task: updated,
      agentModel: subModel,
    };
  }

  // 2. Normal Path: Coordinator analyzes intent
  const systemPrompt = buildCoordinatorSystemPrompt(input.locale);
  const profile = getProfile();
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
  ];

  if (profile.systemPrompt.trim()) {
    messages.push({
      role: "system",
      content: `User style preferences:\n${profile.systemPrompt.trim()}`,
    });
  }

  messages.push({ role: "user", content: input.userPrompt });

  const client = new OpenAI({
    apiKey: requirePoeApiKey(),
    baseURL: env.poeBaseUrl,
  });

  let completion;
  try {
    completion = await client.chat.completions.create({
      model: agentModel,
      stream: false,
      messages,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Coordinator request failed";
    throw Object.assign(new Error(message), { code: "POE_UPSTREAM" });
  }

  const content = completion.choices[0]?.message?.content;
  const raw = typeof content === "string" ? content : "";
  const parsedIntent = parseCoordinatorIntentJson(raw) ?? fallbackCoordinatorIntent(raw);

  // If intent is pure chat or cancel without task
  if (parsedIntent.intent === "chat" || !parsedIntent.delegation) {
    return {
      meta: {
        kind: "coordinator_reply",
        intent: "chat",
        assistantMessage: parsedIntent.assistantMessage,
        agentModel,
      },
      task: null,
      agentModel,
    };
  }

  // If intent is delegate: call subagent specialist
  const subagentType = parsedIntent.delegation.subagent;
  const contextSummary =
    parsedIntent.delegation.contextSummary ||
    buildContextSummary(input.conversationId);

  const specialistInput: SubagentInput = {
    conversationId: input.conversationId,
    subagentType,
    userPrompt: parsedIntent.delegation.taskGoal || input.userPrompt,
    contextSummary,
    locale: input.locale,
    forceSkip: input.forceSkip,
  };

  const { reply, agentModel: subModel } = await dispatchToSpecialist(
    subagentType,
    specialistInput,
  );

  const initialStatus = reply.readyToGenerate ? "ready" : "in_grill";
  const task = createSubagentTask({
    conversationId: input.conversationId,
    subagentType,
    status: initialStatus,
    clarifyingQuestions: reply.clarifyingQuestions,
    suggestedPrompt: reply.suggestedPrompt,
    suggestedSizes: reply.suggestedSizes,
  });

  return {
    meta: {
      kind: "coordinator_reply",
      intent: "delegate",
      assistantMessage: reply.assistantMessage || parsedIntent.assistantMessage,
      subagentType,
      taskId: task.id,
      taskStatus: initialStatus,
      clarifyingQuestions: reply.clarifyingQuestions,
      suggestedPrompt: reply.suggestedPrompt,
      suggestedSizes: reply.suggestedSizes,
      readyToGenerate: reply.readyToGenerate,
      agentModel: subModel,
    },
    task,
    agentModel: subModel,
  };
}
