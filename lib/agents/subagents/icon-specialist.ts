import { buildIconGrillSystemPrompt } from "../icon-grill-system-prompt";
import type { AgentReply, SubagentInput } from "../types";
import { runSpecialistTurn } from "./base";

export async function runIconSpecialistTurn(
  input: SubagentInput,
): Promise<{ reply: AgentReply; agentModel: string }> {
  const systemPrompt = buildIconGrillSystemPrompt(input.locale);
  const skipHint =
    "The user requested to SKIP further clarification this turn. Set readyToGenerate=true, produce the best suggestedPrompt and suggestedSizes (default [16,32,64] if unknown) from known information, and list assumptions.";
  const result = await runSpecialistTurn(input, systemPrompt, skipHint);

  if (input.forceSkip && result.reply.suggestedSizes.length === 0) {
    result.reply.suggestedSizes = [16, 32, 64];
  }

  return result;
}

