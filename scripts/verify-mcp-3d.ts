/**
 * Verification of MCP generate_3d_model path.
 * Usage: pnpm mcp:verify-3d
 */
import fs from "node:fs";
import { loadDotEnv } from "../lib/load-dotenv";
import { mcpGenerate3DModel } from "../lib/mcp/generate";
import { isValidGlbBuffer } from "../lib/providers/3d";

async function main() {
  loadDotEnv();

  console.log("Testing MCP generate_3d_model...");
  const result = await mcpGenerate3DModel({
    prompt: "stylized low-poly wooden chest",
    category: "prop",
    style: "low-poly",
  });

  console.log("conversationId:", result.conversationId);
  console.log("assets:", result.assets.length);

  for (const asset of result.assets) {
    const exists = asset.absolutePath
      ? fs.existsSync(asset.absolutePath)
      : false;
    const underModels = Boolean(asset.absolutePath?.includes("/models/"));
    const isGlbExt = Boolean(asset.absolutePath?.endsWith(".glb"));

    let validMagic = false;
    let byteSize = 0;
    if (exists && asset.absolutePath) {
      const buffer = fs.readFileSync(asset.absolutePath);
      byteSize = buffer.length;
      validMagic = isValidGlbBuffer(buffer);
    }

    console.log({
      id: asset.id,
      absolutePath: asset.absolutePath,
      fileExists: exists,
      underModels,
      isGlbExt,
      byteSize,
      validMagic,
    });

    if (!exists || !underModels || !isGlbExt || !validMagic) {
      console.error(
        "FAIL: 3D model file missing, not under models/, or has invalid glTF magic header",
      );
      process.exit(1);
    }
  }

  console.log("OK: MCP generate_3d_model path works cleanly!");
}

main().catch((err) => {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});

