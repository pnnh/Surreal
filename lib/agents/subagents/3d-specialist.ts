import { build3DGrillSystemPrompt } from "../3d-grill-system-prompt";
import type { AgentReply, SubagentInput } from "../types";
import { runSpecialistTurn } from "./base";

export async function run3DSpecialistTurn(
  input: SubagentInput,
): Promise<{ reply: AgentReply; agentModel: string }> {
  const systemPrompt = build3DGrillSystemPrompt(input.locale);
  const skipHint =
    "The user requested to SKIP further clarification this turn. Set readyToGenerate=true, choose appropriate modelCategory (default 'prop') and modelStyle (default 'low-poly'), produce the best suggestedPrompt, and list assumptions.";
  const result = await runSpecialistTurn(input, systemPrompt, skipHint);

  if (input.forceSkip) {
    if (!result.reply.modelCategory) {
      result.reply.modelCategory = "prop";
    }
    if (!result.reply.modelStyle) {
      result.reply.modelStyle = "low-poly";
    }
  }

  return result;
}

