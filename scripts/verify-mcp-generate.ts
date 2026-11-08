/**
 * Offline verification of MCP generate_image path (same code the MCP tool uses).
 * Usage: pnpm exec tsx --tsconfig tsconfig.json scripts/verify-mcp-generate.ts
 */
import fs from "node:fs";
import { loadDotEnv } from "../lib/load-dotenv";
import { getEnv } from "../lib/env";
import { getModelAllowlist } from "../lib/models/allowlist";
import { mcpGenerateImage } from "../lib/mcp/generate";

async function main() {
  loadDotEnv();
  const env = getEnv();
  console.log("poeConfigured:", env.poeConfigured);
  console.log("models:", JSON.stringify(getModelAllowlist()));

  if (!env.poeConfigured) {
    console.error("FAIL: POE_API_KEY missing after loading .env");
    process.exit(1);
  }

  const result = await mcpGenerateImage({
    prompt:
      "simple flat icon of a blue pixel-art potion bottle, transparent background, game asset",
    model: "GPT-Image-1.5",
  });

  console.log("conversationId:", result.conversationId);
  console.log("assets:", result.assets.length);
  for (const asset of result.assets) {
    const exists = asset.absolutePath
      ? fs.existsSync(asset.absolutePath)
      : false;
    console.log({
      id: asset.id,
      fileUrl: asset.fileUrl,
      absolutePath: asset.absolutePath,
      fileExists: exists,
    });
    if (!exists) {
      console.error("FAIL: asset file missing on disk");
      process.exit(1);
    }
  }
  console.log("OK: MCP generate_image path works");
}

main().catch((err) => {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
