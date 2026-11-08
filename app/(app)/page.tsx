import { ChatWorkspace } from "@/components/chat/ChatWorkspace";
import { PageHeader } from "@/components/PageHeader";

export default function ChatPage() {
  return (
    <div className="space-y-4">
      <PageHeader page="chat" />
      <ChatWorkspace />
    </div>
  );
}
