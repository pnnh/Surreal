import fs from "node:fs";
import path from "node:path";
import { Mock3DProvider } from "./mock-provider";
import { CustomHttp3DProvider } from "./http-provider";
import { GradioSpace3DProvider } from "./gradio-provider";
import { FalAi3DProvider } from "./fal-provider";
import type { ThreeDProvider } from "./types";

export * from "./types";
export * from "./mock-provider";
export * from "./http-provider";
export * from "./gradio-provider";
export * from "./fal-provider";

export function getLiveEnvValue(key: string): string | null {
  if (process.env.NODE_ENV === "test") return null;
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed.startsWith(`${key}=`)) {
          const raw = trimmed.slice(key.length + 1).trim();
          return raw.replace(/^["']|["']$/g, "").trim();
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function get3DProvider(overrideType?: string): ThreeDProvider {
  // Priority:
  // 1. Explicit override argument
  // 2. Real-time value from .env file on disk (hot-reload without process restart)
  // 3. process.env.THREE_D_PROVIDER
  // 4. Fallback to fal if FAL_KEY exists, otherwise mock
  const liveProvider = getLiveEnvValue("THREE_D_PROVIDER");
  const raw =
    overrideType ||
    liveProvider ||
    process.env.THREE_D_PROVIDER ||
    (getLiveEnvValue("FAL_KEY") || process.env.FAL_KEY ? "fal" : "mock");

  const providerType = raw.trim().toLowerCase().replace(/^["']|["']$/g, "");

  switch (providerType) {
    case "fal":
    case "fal_ai":
    case "falai":
      return new FalAi3DProvider();
    case "hf_space":
    case "hf":
    case "gradio":
      return new GradioSpace3DProvider();
    case "custom_http":
    case "http":
      return new CustomHttp3DProvider();
    case "mock":
    default:
      return new Mock3DProvider();
  }
}
