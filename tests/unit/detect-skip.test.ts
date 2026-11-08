import { describe, expect, it } from "vitest";
import { detectsSkipClarification } from "@/lib/agents/detect-skip";

describe("detectsSkipClarification", () => {
  it("detects Chinese skip phrases", () => {
    expect(detectsSkipClarification("直接生成")).toBe(true);
    expect(detectsSkipClarification("不要再问了，出图")).toBe(true);
  });

  it("detects English skip phrases", () => {
    expect(detectsSkipClarification("just generate")).toBe(true);
    expect(detectsSkipClarification("Please skip clarification")).toBe(true);
  });

  it("ignores normal prompts", () => {
    expect(detectsSkipClarification("a red fox in snow")).toBe(false);
    expect(detectsSkipClarification("帮我生成一只狗")).toBe(false);
  });
});
