import { describe, expect, it } from "vitest";
import { buildAssetStorageKey, sanitizeSlug } from "@/lib/storage/asset-path";

describe("buildAssetStorageKey & sanitizeSlug", () => {
  it("builds images path without descriptive slugs (backward compatible)", () => {
    expect(
      buildAssetStorageKey({
        conversationId: "conv1",
        assetType: "image",
        assetId: "asset1",
        ext: "png",
      }),
    ).toBe("conv1/images/asset1.png");
  });

  it("builds icons path", () => {
    expect(
      buildAssetStorageKey({
        conversationId: "conv2",
        assetType: "icon",
        assetId: "asset2",
        ext: ".webp",
      }),
    ).toBe("conv2/icons/asset2.webp");
  });

  it("builds svg path", () => {
    expect(
      buildAssetStorageKey({
        conversationId: "conv3",
        assetType: "svg",
        assetId: "asset3",
        ext: "svg",
      }),
    ).toBe("conv3/svg/asset3.svg");
  });

  it("builds models path with descriptive title and prompt slugs", () => {
    const key = buildAssetStorageKey({
      conversationId: "01M75WTPR7NX8F9KG1F5MX8SP8",
      assetType: "model",
      assetId: "01M75WTPS3V71VB2C2BR70N7X4",
      ext: "glb",
      conversationTitle: "a stylized wooden chest",
      description: "low-poly stylized wooden barrel with metal hoops",
    });

    expect(key).toBe(
      "01M75WTPR7NX8F9KG1F5MX8SP8-a-stylized-wooden-chest/models/01M75WTPS3V71VB2C2BR70N7X4-low-poly-stylized-wooden-barrel-with-met.glb",
    );
  });

  it("supports Chinese characters and punctuation in titles and descriptions", () => {
    const key = buildAssetStorageKey({
      conversationId: "01M75WTPR7NX8F9KG1F5MX8SP8",
      assetType: "model",
      assetId: "01M75WTPS3V71VB2C2BR70N7X4",
      ext: "glb",
      conversationTitle: "低模游戏木桶",
      description: "带有金属包边的木桶，用于场景道具",
    });

    expect(key).toBe(
      "01M75WTPR7NX8F9KG1F5MX8SP8-低模游戏木桶/models/01M75WTPS3V71VB2C2BR70N7X4-带有金属包边的木桶-用于场景道具.glb",
    );
  });

  it("sanitizeSlug strips forbidden filesystem characters and handles lengths", () => {
    expect(sanitizeSlug("Hello: World / Test?*")).toBe("hello-world-test");
    expect(sanitizeSlug("   a...b///c???   ")).toBe("a-b-c");
    expect(sanitizeSlug("中文字符/测试：道具！")).toBe("中文字符-测试-道具");
    expect(sanitizeSlug(null)).toBe("");
    expect(sanitizeSlug("")).toBe("");
  });
});
