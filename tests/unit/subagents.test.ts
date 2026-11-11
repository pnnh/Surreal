import { describe, expect, it } from "vitest";
import {
  agentReplySchema,
  fallbackAgentReply,
  parseAgentReplyJson,
  type SubagentInput,
} from "@/lib/agents/types";

describe("Subagent Specialist contract & parsing", () => {
  it("validates standard subagent output structure", () => {
    const raw = {
      assistantMessage: "I need to confirm the icon dimensions.",
      clarifyingQuestions: ["Do you want 16x16 or 32x32?", "Is transparent background needed?"],
      suggestedPrompt: "pixel art potion bottle, crisp outline",
      suggestedSizes: [16, 32],
      readyToGenerate: false,
      assumptions: ["Assumes 2D pixel style"],
    };

    const parsed = agentReplySchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.suggestedSizes).toEqual([16, 32]);
      expect(parsed.data.clarifyingQuestions).toHaveLength(2);
    }
  });

  it("handles SVG specialist output contract", () => {
    const raw = {
      assistantMessage: "Ready to generate SVG vector icon.",
      clarifyingQuestions: [],
      suggestedPrompt: "monochrome shopping cart icon, clean vector lines, uses currentColor",
      suggestedSizes: [],
      readyToGenerate: true,
      assumptions: ["Uses currentColor and viewBox"],
    };

    const parsed = parseAgentReplyJson(JSON.stringify(raw));
    expect(parsed).not.toBeNull();
    expect(parsed?.readyToGenerate).toBe(true);
    expect(parsed?.suggestedSizes).toEqual([]);
  });

  it("verifies SubagentInput contract shape", () => {
    const input: SubagentInput = {
      conversationId: "test-conv",
      subagentType: "icon",
      userPrompt: "make a coin icon",
      contextSummary: "warm fantasy palette",
      taskHistory: [{ role: "user", content: "make a coin icon" }],
      locale: "zh",
      forceSkip: false,
    };

    expect(input.subagentType).toBe("icon");
    expect(input.locale).toBe("zh");
    expect(input.contextSummary).toContain("fantasy palette");
  });

  it("provides reliable fallback when parsing fails", () => {
    const fallback = fallbackAgentReply("raw unformatted answer");
    expect(fallback.readyToGenerate).toBe(false);
    expect(fallback.suggestedPrompt).toBe("");
    expect(fallback.clarifyingQuestions).toEqual([]);
  });
});

