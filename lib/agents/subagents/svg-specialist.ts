import { buildSvgGrillSystemPrompt } from "../svg-grill-system-prompt";
import type { AgentReply, SubagentInput } from "../types";
import { runSpecialistTurn } from "./base";

export async function runSvgSpecialistTurn(
  input: SubagentInput,
): Promise<{ reply: AgentReply; agentModel: string }> {
  const systemPrompt = buildSvgGrillSystemPrompt(input.locale);
  const skipHint =
    "The user requested to SKIP further clarification this turn. Set readyToGenerate=true, produce the best suggestedPrompt for a monochrome currentColor SVG icon, leave suggestedSizes empty, and list assumptions.";
  const result = await runSpecialistTurn(input, systemPrompt, skipHint);

  if (input.forceSkip) {
    result.reply.suggestedSizes = [];
  }

  return result;
}

