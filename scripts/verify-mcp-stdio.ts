/**
 * Smoke-test MCP stdio: list tools via Client + StdioClientTransport.
 * Usage: pnpm exec tsx --tsconfig tsconfig.json scripts/verify-mcp-stdio.ts
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const transport = new StdioClientTransport({
    command: "pnpm",
    args: ["mcp"],
    cwd: process.cwd(),
    stderr: "pipe",
  });

  const client = new Client({ name: "surreal-mcp-verify", version: "0.1.0" });
  await client.connect(transport);

  const tools = await client.listTools();
  const names = tools.tools.map((t) => t.name).sort();
  console.log("tools:", names.join(", "));

  const expected = ["generate_image", "generate_icon", "list_image_models"];
  for (const name of expected) {
    if (!names.includes(name)) {
      console.error(`FAIL: missing tool ${name}`);
      await client.close();
      process.exit(1);
    }
  }

  const models = await client.callTool({
    name: "list_image_models",
    arguments: {},
  });
  console.log("list_image_models:", JSON.stringify(models.content).slice(0, 400));

  await client.close();
  console.log("OK: MCP stdio handshake + tools available");
}

main().catch((err) => {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
