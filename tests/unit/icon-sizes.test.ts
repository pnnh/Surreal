import { describe, expect, it } from "vitest";
import {
  appendIconSizeToPrompt,
  DEFAULT_ICON_SIZES,
  normalizeIconSizes,
} from "@/lib/icons/sizes";

describe("normalizeIconSizes", () => {
  it("uses defaults when empty", () => {
    const result = normalizeIconSizes([]);
    expect(result.usedDefault).toBe(true);
    expect(result.sizes).toEqual([...DEFAULT_ICON_SIZES]);
  });

  it("dedupes and sorts valid sizes", () => {
    const result = normalizeIconSizes([64, 16, 64, 32]);
    expect(result.usedDefault).toBe(false);
    expect(result.sizes).toEqual([16, 32, 64]);
  });

  it("rejects out of range", () => {
    const result = normalizeIconSizes([8, 2048, 32]);
    expect(result.sizes).toEqual([32]);
    expect(result.rejected).toEqual([8, 2048]);
  });
});

describe("appendIconSizeToPrompt", () => {
  it("embeds size and transparency hints", () => {
    const out = appendIconSizeToPrompt("shopping cart icon", 32);
    expect(out).toContain("32x32");
    expect(out.toLowerCase()).toContain("transparent");
  });
});
