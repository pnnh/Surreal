import { describe, expect, it } from "vitest";
import {
  buildCoordinatorSystemPrompt,
  fallbackCoordinatorIntent,
  parseCoordinatorIntentJson,
} from "@/lib/agents/coordinator/intent-prompt";

describe("Coordinator Intent Recognition & Parsing", () => {
  it("builds correct system prompt for en and zh", () => {
    const zh = buildCoordinatorSystemPrompt("zh");
    const en = buildCoordinatorSystemPrompt("en");
    expect(zh).toContain("Simplified Chinese");
    expect(en).toContain("English");
    expect(zh).toContain("Coordinator Agent");
  });

  it("parses raw chat intent", () => {
    const raw = JSON.stringify({
      intent: "chat",
      assistantMessage: "Hello! I can help you create game assets.",
    });
    const parsed = parseCoordinatorIntentJson(raw);
    expect(parsed?.intent).toBe("chat");
    expect(parsed?.assistantMessage).toContain("Hello!");
    expect(parsed?.delegation).toBeUndefined();
  });

  it("parses delegate intent for image subagent", () => {
    const raw = JSON.stringify({
      intent: "delegate",
      assistantMessage: "Let me bring in our image specialist to design your character.",
      delegation: {
        subagent: "image",
        taskGoal: "cyberpunk warrior in rain",
        contextSummary: "neon color palette",
      },
    });
    const parsed = parseCoordinatorIntentJson(raw);
    expect(parsed?.intent).toBe("delegate");
    expect(parsed?.delegation?.subagent).toBe("image");
    expect(parsed?.delegation?.taskGoal).toBe("cyberpunk warrior in rain");
  });

  it("parses delegate intent for icon subagent in fenced markdown", () => {
    const raw = `I will coordinate this for you.
\`\`\`json
{
  "intent": "delegate",
  "assistantMessage": "Consulting our icon specialist for a health potion icon.",
  "delegation": {
    "subagent": "icon",
    "taskGoal": "health potion item icon, 16 and 32 sizes",
    "contextSummary": "pixel art style"
  }
}
\`\`\``;
    const parsed = parseCoordinatorIntentJson(raw);
    expect(parsed?.intent).toBe("delegate");
    expect(parsed?.delegation?.subagent).toBe("icon");
  });

  it("parses cancel intent", () => {
    const raw = JSON.stringify({
      intent: "cancel",
      assistantMessage: "Cancelled the active task.",
    });
    const parsed = parseCoordinatorIntentJson(raw);
    expect(parsed?.intent).toBe("cancel");
  });

  it("falls back gracefully when given invalid json", () => {
    expect(parseCoordinatorIntentJson("not json text")).toBeNull();
    const fallback = fallbackCoordinatorIntent("I can assist with images and icons.");
    expect(fallback.intent).toBe("chat");
    expect(fallback.assistantMessage).toContain("I can assist");
  });
});

