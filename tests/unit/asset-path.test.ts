import { describe, expect, it } from "vitest";
import { buildAssetStorageKey } from "@/lib/storage/asset-path";

describe("buildAssetStorageKey", () => {
  it("builds images path", () => {
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
});

