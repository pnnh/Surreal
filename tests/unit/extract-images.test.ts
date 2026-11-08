import { describe, expect, it } from "vitest";
import { extractImageUrlsFromText } from "@/lib/providers/extract-images";

describe("extractImageUrlsFromText", () => {
  it("extracts markdown image urls", () => {
    const text = "here ![img](https://cdn.example.com/a.png)";
    expect(extractImageUrlsFromText(text)).toEqual([
      "https://cdn.example.com/a.png",
    ]);
  });

  it("extracts data urls", () => {
    const text = "data:image/png;base64,abc123";
    expect(extractImageUrlsFromText(text)[0]).toContain("data:image/png");
  });
});
