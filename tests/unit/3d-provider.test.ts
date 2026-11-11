import { describe, expect, it } from "vitest";
import {
  Mock3DProvider,
  createMockGlbBuffer,
  get3DProvider,
  isValidGlbBuffer,
} from "@/lib/providers/3d";

describe("3D Provider & GLB Generator (Spec-007)", () => {
  it("createMockGlbBuffer produces a valid glTF 2.0 Binary structure", () => {
    const glb = createMockGlbBuffer({
      prompt: "low-poly treasure chest",
      category: "prop",
    });

    expect(glb.length).toBeGreaterThan(100);

    // Verify 12-byte header
    const magic = glb.subarray(0, 4).toString("ascii");
    expect(magic).toBe("glTF");

    const version = glb.readUInt32LE(4);
    expect(version).toBe(2);

    const totalLength = glb.readUInt32LE(8);
    expect(totalLength).toBe(glb.length);

    // Verify Chunk 0 is JSON
    const jsonChunkLength = glb.readUInt32LE(12);
    const jsonChunkType = glb.subarray(16, 20).toString("ascii");
    expect(jsonChunkType).toBe("JSON");

    const jsonString = glb.subarray(20, 20 + jsonChunkLength).toString("utf-8");
    const parsedGltf = JSON.parse(jsonString.trim());
    expect(parsedGltf.asset.version).toBe("2.0");
    expect(parsedGltf.scenes).toBeDefined();
    expect(parsedGltf.meshes[0].primitives[0].mode).toBe(4); // TRIANGLES
  });

  it("isValidGlbBuffer correctly identifies valid and corrupted GLBs", () => {
    const validGlb = createMockGlbBuffer();
    expect(isValidGlbBuffer(validGlb)).toBe(true);

    const corruptHeader = Buffer.from(validGlb);
    corruptHeader.write("HTML", 0, 4, "ascii");
    expect(isValidGlbBuffer(corruptHeader)).toBe(false);

    const tooShort = Buffer.from("glTF");
    expect(isValidGlbBuffer(tooShort)).toBe(false);
  });

  it("Mock3DProvider generates result with proper metadata", async () => {
    const provider = new Mock3DProvider();
    const result = await provider.generate({
      prompt: "fantasy knight armor",
      category: "character",
      style: "pbr",
    });

    expect(result.format).toBe("glb");
    expect(isValidGlbBuffer(result.glbBuffer)).toBe(true);
    expect(result.metadata?.category).toBe("character");
    expect(result.metadata?.style).toBe("pbr");
    expect(result.metadata?.provider).toBe("mock");
  });

  it("get3DProvider returns Mock3DProvider by default, and can return CustomHttp3DProvider or GradioSpace3DProvider", () => {
    const defaultProvider = get3DProvider();
    expect(defaultProvider.name).toBe("mock");

    const httpProvider = get3DProvider("custom_http");
    expect(httpProvider.name).toBe("custom_http");

    const hfProvider = get3DProvider("hf_space");
    expect(hfProvider.name).toBe("hf_space");

    const falProvider = get3DProvider("fal");
    expect(falProvider.name).toBe("fal_ai");
  });
});

