import { buildGrillSystemPrompt } from "../grill-system-prompt";
import type { AgentReply, SubagentInput } from "../types";
import { runSpecialistTurn } from "./base";

export async function runImageSpecialistTurn(
  input: SubagentInput,
): Promise<{ reply: AgentReply; agentModel: string }> {
  const systemPrompt = buildGrillSystemPrompt(input.locale);
  const skipHint =
    "The user requested to SKIP further clarification this turn. Set readyToGenerate=true, produce the best suggestedPrompt from known information, and list assumptions.";
  return runSpecialistTurn(input, systemPrompt, skipHint);
}

