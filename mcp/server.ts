#!/usr/bin/env node
/**
 * Surreal MCP server — direct image generation (no grill clarification).
 * Run: pnpm mcp
 * No authentication in MVP; intended for trusted local agents only.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getEnv } from "../lib/env";
import { getModelAllowlist } from "../lib/models/allowlist";
import { mcpGenerateImage } from "../lib/mcp/generate";

const server = new McpServer({
  name: "surreal-image",
  version: "0.1.0",
});

server.registerTool(
  "list_image_models",
  {
    title: "List image models",
    description: "List Surreal image model allowlist and default model",
  },
  async () => {
    const list = getModelAllowlist();
    return {
      content: [{ type: "text", text: JSON.stringify(list, null, 2) }],
    };
  },
);

server.registerTool(
  "generate_image",
  {
    title: "Generate image",
    description:
      "Generate an image directly from a prompt via Poe (no clarification loop). Saves locally and records an MCP session.",
    inputSchema: {
      prompt: z.string().min(1).describe("Image generation prompt"),
      model: z
        .string()
        .optional()
        .describe("Optional Poe image model id (default GPT-Image-1.5)"),
    },
  },
  async ({ prompt, model }) => {
    if (!getEnv().poeConfigured) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "POE_API_KEY is not configured in the environment.",
          },
        ],
      };
    }

    try {
      const result = await mcpGenerateImage({ prompt, model });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      return {
        isError: true,
        content: [{ type: "text", text: message }],
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
