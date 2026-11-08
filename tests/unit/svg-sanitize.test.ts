import { describe, expect, it } from "vitest";
import { extractSvgMarkup, sanitizeSvg } from "@/lib/svg/sanitize";

const good = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M0 0h24v24H0z"/></svg>`;

describe("extractSvgMarkup", () => {
  it("extracts fenced svg", () => {
    const raw = "Here:\n```svg\n" + good + "\n```\n";
    expect(extractSvgMarkup(raw)).toContain("<svg");
  });
});

describe("sanitizeSvg", () => {
  it("accepts viewBox + currentColor", () => {
    const result = sanitizeSvg(good);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.hasViewBox).toBe(true);
      expect(result.usesCurrentColor).toBe(true);
    }
  });

  it("rejects missing viewBox", () => {
    const result = sanitizeSvg(
      `<svg xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M0 0h24v24H0z"/></svg>`,
    );
    expect(result.ok).toBe(false);
  });

  it("rejects script", () => {
    const result = sanitizeSvg(
      `<svg viewBox="0 0 24 24"><script>alert(1)</script><path fill="currentColor" d="M0 0"/></svg>`,
    );
    expect(result.ok).toBe(false);
  });

  it("rewrites hardcoded fill to currentColor", () => {
    const result = sanitizeSvg(
      `<svg viewBox="0 0 24 24"><path fill="#112233" d="M0 0h24v24H0z"/></svg>`,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.svg).toContain("currentColor");
    }
  });
});
