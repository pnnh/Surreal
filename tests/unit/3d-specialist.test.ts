import { describe, expect, it } from "vitest";
import { build3DGrillSystemPrompt } from "@/lib/agents/3d-grill-system-prompt";
import {
  buildCoordinatorSystemPrompt,
  parseCoordinatorIntentJson,
} from "@/lib/agents/coordinator/intent-prompt";
import { agentReplySchema } from "@/lib/agents/types";

describe("ThreeDSpecialist & 3D Intent Routing (Spec-007)", () => {
  it("Coordinator intent parser accurately parses 3D delegation", () => {
    const raw = `\`\`\`json
{
  "intent": "delegate",
  "assistantMessage": "I will coordinate with our 3D Specialist to model this asset for you.",
  "delegation": {
    "subagent": "model",
    "taskGoal": "low-poly wooden chest",
    "contextSummary": "medieval dungeon theme"
  }
}
\`\`\``;

    const parsed = parseCoordinatorIntentJson(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.intent).toBe("delegate");
    expect(parsed?.delegation?.subagent).toBe("model");
    expect(parsed?.delegation?.taskGoal).toBe("low-poly wooden chest");
  });

  it("build3DGrillSystemPrompt contains 3D category presets and geometry rules", () => {
    const promptEn = build3DGrillSystemPrompt("en");
    expect(promptEn).toContain("character");
    expect(promptEn).toContain("prop");
    expect(promptEn).toContain("hard_surface");
    expect(promptEn).toContain("foliage");
    expect(promptEn).toContain("low-poly");
    expect(promptEn).toContain("modelCategory");
    expect(promptEn).toContain("modelStyle");

    const promptZh = build3DGrillSystemPrompt("zh");
    expect(promptZh).toContain("Simplified Chinese");
  });

  it("Coordinator system prompt instructs delegation to 3D Specialist", () => {
    const prompt = buildCoordinatorSystemPrompt("en");
    expect(prompt).toContain('Delegate to 3D Specialist ("model")');
    expect(prompt).toContain(".glb");
  });

  it("agentReplySchema validates 3D model properties", () => {
    const valid3DReply = {
      assistantMessage: "Here are a few questions for the 3D model.",
      clarifyingQuestions: ["What polycount budget do you need?", "Is it a prop or character?"],
      suggestedPrompt: "low-poly treasure chest, clean topology, neutral background",
      modelCategory: "prop",
      modelStyle: "low-poly",
      readyToGenerate: false,
      assumptions: ["Origin placed at bottom center"],
    };

    const parsed = agentReplySchema.safeParse(valid3DReply);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.modelCategory).toBe("prop");
      expect(parsed.data.modelStyle).toBe("low-poly");
    }
  });
});

