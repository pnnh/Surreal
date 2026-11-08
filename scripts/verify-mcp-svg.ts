/**
 * Offline verification of MCP generate_svg_icon path.
 * Usage: pnpm mcp:verify-svg
 */
import fs from "node:fs";
import { loadDotEnv } from "../lib/load-dotenv";
import { getEnv } from "../lib/env";
import { mcpGenerateSvgIcon } from "../lib/mcp/generate";

async function main() {
  loadDotEnv();
  const env = getEnv();
  console.log("poeConfigured:", env.poeConfigured);
  if (!env.poeConfigured) {
    console.error("FAIL: POE_API_KEY missing after loading .env");
    process.exit(1);
  }

  const result = await mcpGenerateSvgIcon({
    prompt: "simple flat shopping cart icon, monochrome, toolbar style",
  });

  console.log("conversationId:", result.conversationId);
  console.log("assets:", result.assets.length);
  for (const asset of result.assets) {
    const exists = asset.absolutePath
      ? fs.existsSync(asset.absolutePath)
      : false;
    const underSvg = Boolean(asset.absolutePath?.includes("/svg/"));
    const text =
      exists && asset.absolutePath
        ? fs.readFileSync(asset.absolutePath, "utf8")
        : "";
    console.log({
      id: asset.id,
      absolutePath: asset.absolutePath,
      fileExists: exists,
      underSvg,
      hasViewBox: /viewBox/i.test(text),
      hasCurrentColor: /currentColor/i.test(text),
    });
    if (
      !exists ||
      !underSvg ||
      !/viewBox/i.test(text) ||
      !/currentColor/i.test(text)
    ) {
      console.error("FAIL: svg file missing or missing viewBox/currentColor");
      process.exit(1);
    }
  }
  console.log("OK: MCP generate_svg_icon path works");
}

main().catch((err) => {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
