import { describe, expect, it } from "vitest";
import { detectBrowserLocale } from "@/lib/i18n/messages";

describe("detectBrowserLocale", () => {
  it("defaults to English for non-Chinese languages", () => {
    expect(detectBrowserLocale("en-US")).toBe("en");
    expect(detectBrowserLocale("fr-FR")).toBe("en");
    expect(detectBrowserLocale("ja")).toBe("en");
  });

  it("selects Chinese for zh*", () => {
    expect(detectBrowserLocale("zh-CN")).toBe("zh");
    expect(detectBrowserLocale("zh-TW")).toBe("zh");
    expect(detectBrowserLocale("zh")).toBe("zh");
  });
});
