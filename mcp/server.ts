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
import { loadDotEnv } from "../lib/load-dotenv";
import { getModelAllowlist } from "../lib/models/allowlist";
import {
  mcpGenerate3DModel,
  mcpGenerateIcon,
  mcpGenerateImage,
  mcpGenerateSvgIcon,
} from "../lib/mcp/generate";

loadDotEnv();

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

server.registerTool(
  "generate_icon",
  {
    title: "Generate icon",
    description:
      "Generate bitmap app/web icons at one or more pixel sizes (no clarification). Saves under conversation icons/ directory. Default sizes: 16, 32, 64.",
    inputSchema: {
      prompt: z.string().min(1).describe("Icon generation prompt"),
      sizes: z
        .array(z.number().int().positive())
        .max(12)
        .optional()
        .describe("Pixel edge lengths (default [16,32,64], max 12)"),
      model: z
        .string()
        .optional()
        .describe("Optional Poe image model id (default GPT-Image-1.5)"),
    },
  },
  async ({ prompt, sizes, model }) => {
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
      const result = await mcpGenerateIcon({ prompt, sizes, model });
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

server.registerTool(
  "generate_svg_icon",
  {
    title: "Generate SVG icon",
    description:
      "Generate a single CSS-colorable/scalable SVG icon from a prompt (no clarification). Uses viewBox + currentColor. Saves under conversation svg/ directory.",
    inputSchema: {
      prompt: z.string().min(1).describe("SVG icon brief / prompt"),
      model: z
        .string()
        .optional()
        .describe("Optional Poe text model id (default SURREAL_AGENT_MODEL)"),
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
      const result = await mcpGenerateSvgIcon({ prompt, model });
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

server.registerTool(
  "generate_3d_model",
  {
    title: "Generate 3D model",
    description:
      "Generate a game-ready 3D static mesh (.glb) from a prompt (no clarification). Saves under conversation models/ directory as a binary glTF file.",
    inputSchema: {
      prompt: z.string().min(1).describe("3D model description/prompt"),
      category: z
        .enum(["character", "prop", "hard_surface", "foliage"])
        .optional()
        .describe("Optional 3D asset category (default: prop)"),
      style: z
        .enum(["low-poly", "pbr", "stylized"])
        .optional()
        .describe("Optional 3D shading style (default: low-poly)"),
      seed: z.number().int().optional().describe("Optional random seed"),
    },
  },
  async ({ prompt, category, style, seed }) => {
    try {
      const result = await mcpGenerate3DModel({
        prompt,
        category,
        style,
        seed,
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "3D generation failed";
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
