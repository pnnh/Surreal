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

export function get3DProvider(overrideType?: string): ThreeDProvider {
  const providerType =
    overrideType ||
    process.env.THREE_D_PROVIDER ||
    (process.env.FAL_KEY ? "fal" : "mock");

  switch (providerType.toLowerCase()) {
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

