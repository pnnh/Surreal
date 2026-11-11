import type {
  ThreeDGenerateOptions,
  ThreeDGenerateResult,
  ThreeDProvider,
} from "./types";

/**
 * Creates a valid glTF 2.0 Binary (.glb) containing a stylized low-poly crystal mesh.
 * This guarantees offline development, CI/unit tests, and UI rendering work with 0 external dependencies.
 */
export function createMockGlbBuffer(options?: {
  prompt?: string;
  category?: string;
  color?: [number, number, number, number];
}): Buffer {
  // Vertices for a stylized 3D crystal / gem (6 vertices, 8 triangles)
  // Top apex (0, 1.0, 0)
  // Mid ring: 4 vertices around Y=0.3
  // Bottom apex (0, -0.4, 0)
  const positions = new Float32Array([
    0.0, 1.0, 0.0, // 0: Top
    -0.5, 0.3, -0.5, // 1: Front-left
    0.5, 0.3, -0.5, // 2: Front-right
    0.5, 0.3, 0.5, // 3: Back-right
    -0.5, 0.3, 0.5, // 4: Back-left
    0.0, -0.4, 0.0, // 5: Bottom
  ]);

  // Indices for 8 triangles forming the double-pyramid crystal
  const indices = new Uint16Array([
    // Top pyramid
    0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1,
    // Bottom pyramid
    5, 2, 1, 5, 3, 2, 5, 4, 3, 5, 1, 4,
  ]);

  const indicesBytes = Buffer.from(indices.buffer);
  const positionsBytes = Buffer.from(positions.buffer);

  // Align bufferViews to 4-byte boundary
  const indicesPadding = (4 - (indicesBytes.length % 4)) % 4;
  const positionsOffset = indicesBytes.length + indicesPadding;
  const positionsPadding = (4 - (positionsBytes.length % 4)) % 4;
  const totalBinLength =
    positionsOffset + positionsBytes.length + positionsPadding;

  const binBuffer = Buffer.alloc(totalBinLength);
  indicesBytes.copy(binBuffer, 0);
  positionsBytes.copy(binBuffer, positionsOffset);

  // Pick color based on category
  const baseColor: [number, number, number, number] =
    options?.color ??
    (options?.category === "character"
      ? [0.9, 0.4, 0.4, 1.0] // Warm coral
      : options?.category === "foliage"
        ? [0.2, 0.8, 0.4, 1.0] // Forest green
        : options?.category === "hard_surface"
          ? [0.6, 0.65, 0.75, 1.0] // Metallic silver
          : [0.25, 0.65, 0.95, 1.0]); // Stylized gem blue

  const gltfJson = {
    asset: {
      version: "2.0",
      generator: "Surreal Mock3DProvider (Spec-007)",
    },
    scene: 0,
    scenes: [{ nodes: [0], name: "DefaultScene" }],
    nodes: [{ mesh: 0, name: options?.prompt || "Mock3DObject" }],
    materials: [
      {
        name: "MockPBRMaterial",
        pbrMetallicRoughness: {
          baseColorFactor: baseColor,
          metallicFactor: 0.2,
          roughnessFactor: 0.35,
        },
        doubleSided: true,
      },
    ],
    meshes: [
      {
        name: "MockCrystalMesh",
        primitives: [
          {
            attributes: { POSITION: 1 },
            indices: 0,
            material: 0,
            mode: 4, // TRIANGLES
          },
        ],
      },
    ],
    accessors: [
      {
        bufferView: 0,
        byteOffset: 0,
        componentType: 5123, // UNSIGNED_SHORT
        count: indices.length,
        type: "SCALAR",
        max: [5],
        min: [0],
      },
      {
        bufferView: 1,
        byteOffset: 0,
        componentType: 5126, // FLOAT
        count: positions.length / 3,
        type: "VEC3",
        max: [0.5, 1.0, 0.5],
        min: [-0.5, -0.4, -0.5],
      },
    ],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: 0,
        byteLength: indicesBytes.length,
        target: 34963, // ELEMENT_ARRAY_BUFFER
      },
      {
        buffer: 0,
        byteOffset: positionsOffset,
        byteLength: positionsBytes.length,
        target: 34962, // ARRAY_BUFFER
      },
    ],
    buffers: [
      {
        byteLength: totalBinLength,
      },
    ],
  };

  const jsonString = JSON.stringify(gltfJson);
  const jsonBuffer = Buffer.from(jsonString, "utf-8");
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const paddedJsonLength = jsonBuffer.length + jsonPadding;

  const paddedJsonBuffer = Buffer.alloc(paddedJsonLength, 0x20); // Pad with spaces
  jsonBuffer.copy(paddedJsonBuffer, 0);

  // Total GLB = 12 (Header) + 8 (JSON Chunk Header) + paddedJsonLength + 8 (BIN Chunk Header) + totalBinLength
  const totalGlbLength =
    12 + 8 + paddedJsonLength + 8 + totalBinLength;
  const glb = Buffer.alloc(totalGlbLength);

  // 12-byte GLB Header
  glb.write("glTF", 0, 4, "ascii"); // Magic: 0x46546C67
  glb.writeUInt32LE(2, 4); // Version: 2
  glb.writeUInt32LE(totalGlbLength, 8); // Total length

  // Chunk 0: JSON
  glb.writeUInt32LE(paddedJsonLength, 12);
  glb.write("JSON", 16, 4, "ascii"); // 0x4E4F534A
  paddedJsonBuffer.copy(glb, 20);

  // Chunk 1: BIN
  const binChunkOffset = 20 + paddedJsonLength;
  glb.writeUInt32LE(totalBinLength, binChunkOffset);
  glb.write("BIN\0", binChunkOffset + 4, 4, "ascii"); // 0x004E4942
  binBuffer.copy(glb, binChunkOffset + 8);

  return glb;
}

export class Mock3DProvider implements ThreeDProvider {
  readonly name = "mock";

  async generate(options: ThreeDGenerateOptions): Promise<ThreeDGenerateResult> {
    const glbBuffer = createMockGlbBuffer({
      prompt: options.prompt,
      category: options.category,
    });

    return {
      glbBuffer,
      format: "glb",
      metadata: {
        category: options.category ?? "prop",
        style: options.style ?? "low-poly",
        provider: "mock",
        prompt: options.prompt,
        seed: options.seed ?? 42,
        byteSize: glbBuffer.length,
      },
    };
  }
}

