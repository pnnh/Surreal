/**
 * Offline verification of MCP generate_icon path.
 * Usage: pnpm mcp:verify-icon
 */
import fs from "node:fs";
import { loadDotEnv } from "../lib/load-dotenv";
import { getEnv } from "../lib/env";
import { mcpGenerateIcon } from "../lib/mcp/generate";

async function main() {
  loadDotEnv();
  const env = getEnv();
  console.log("poeConfigured:", env.poeConfigured);
  if (!env.poeConfigured) {
    console.error("FAIL: POE_API_KEY missing after loading .env");
    process.exit(1);
  }

  const result = await mcpGenerateIcon({
    prompt: "simple flat shopping cart icon, minimal, transparent background",
    sizes: [32, 64],
    model: "GPT-Image-1.5",
  });

  console.log("conversationId:", result.conversationId);
  console.log("assets:", result.assets.length);
  for (const asset of result.assets) {
    const exists = asset.absolutePath
      ? fs.existsSync(asset.absolutePath)
      : false;
    const underIcons = Boolean(
      asset.absolutePath?.includes(`${pathSep()}icons${pathSep()}`) ||
        asset.absolutePath?.includes("/icons/"),
    );
    console.log({
      id: asset.id,
      width: asset.width,
      absolutePath: asset.absolutePath,
      fileExists: exists,
      underIcons,
    });
    if (!exists || !underIcons) {
      console.error("FAIL: icon file missing or not under icons/");
      process.exit(1);
    }
  }
  console.log("OK: MCP generate_icon path works");
}

function pathSep() {
  return process.platform === "win32" ? "\\" : "/";
}

main().catch((err) => {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
