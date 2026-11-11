import { Mock3DProvider } from "./mock-provider";
import { CustomHttp3DProvider } from "./http-provider";
import type { ThreeDProvider } from "./types";

export * from "./types";
export * from "./mock-provider";
export * from "./http-provider";

export function get3DProvider(overrideType?: string): ThreeDProvider {
  const providerType =
    overrideType ||
    process.env.THREE_D_PROVIDER ||
    "mock";

  switch (providerType.toLowerCase()) {
    case "custom_http":
    case "http":
      return new CustomHttp3DProvider();
    case "mock":
    default:
      return new Mock3DProvider();
  }
}

