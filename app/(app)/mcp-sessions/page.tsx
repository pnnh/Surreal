import { McpSessionsPanel } from "@/components/mcp/McpSessionsPanel";
import { PageHeader } from "@/components/PageHeader";

export default function McpSessionsPage() {
  return (
    <div className="space-y-4">
      <PageHeader page="mcp" />
      <McpSessionsPanel />
    </div>
  );
}
