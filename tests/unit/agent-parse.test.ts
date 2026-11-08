import { describe, expect, it } from "vitest";
import {
  fallbackAgentReply,
  parseAgentReplyJson,
} from "@/lib/agents/types";

describe("parseAgentReplyJson", () => {
  it("parses raw json", () => {
    const reply = parseAgentReplyJson(
      JSON.stringify({
        assistantMessage: "What breed?",
        clarifyingQuestions: ["Color?", "Size?"],
        suggestedPrompt: "a brown dog",
        readyToGenerate: false,
        assumptions: [],
      }),
    );
    expect(reply?.assistantMessage).toBe("What breed?");
    expect(reply?.clarifyingQuestions).toHaveLength(2);
  });

  it("parses fenced json", () => {
    const reply = parseAgentReplyJson(
      'Here you go:\n```json\n{"assistantMessage":"Ready","clarifyingQuestions":[],"suggestedPrompt":"a cat","readyToGenerate":true,"assumptions":[]}\n```',
    );
    expect(reply?.readyToGenerate).toBe(true);
    expect(reply?.suggestedPrompt).toBe("a cat");
  });

  it("parses suggestedSizes for icons", () => {
    const reply = parseAgentReplyJson(
      JSON.stringify({
        assistantMessage: "Ready for icon",
        clarifyingQuestions: [],
        suggestedPrompt: "flat cart icon, transparent background",
        suggestedSizes: [16, 32, 64],
        readyToGenerate: true,
        assumptions: [],
      }),
    );
    expect(reply?.suggestedSizes).toEqual([16, 32, 64]);
  });

  it("falls back on invalid json", () => {
    expect(parseAgentReplyJson("not json")).toBeNull();
    const fb = fallbackAgentReply("please clarify");
    expect(fb.readyToGenerate).toBe(false);
    expect(fb.assistantMessage).toContain("please clarify");
  });
});
