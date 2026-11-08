"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AgentReplyCard,
  type AgentMetaView,
} from "@/components/chat/AgentReplyCard";
import { useI18n } from "@/lib/i18n/LocaleProvider";

type ModelAllowlist = {
  defaultModel: string;
  models: Array<{ id: string; label: string; enabled: boolean }>;
  allowCustomModelId: boolean;
};

type Conversation = {
  id: string;
  title: string | null;
  model: string;
  updatedAt: string;
};

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  assetIds?: string[];
  meta?: AgentMetaView | Record<string, unknown> | null;
};

export function ChatWorkspace() {
  const { t, locale } = useI18n();
  const [models, setModels] = useState<ModelAllowlist | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [model, setModel] = useState("GPT-Image-1.5");
  const [customModel, setCustomModel] = useState("");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [poeConfigured, setPoeConfigured] = useState<boolean | null>(null);

  const selectedModel = useMemo(
    () => (customModel.trim() ? customModel.trim() : model),
    [customModel, model],
  );

  const refreshConversations = useCallback(async () => {
    const res = await fetch("/api/conversations");
    const data = await res.json();
    setConversations(data.items ?? []);
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    const res = await fetch(`/api/conversations/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setActiveId(id);
    setMessages(data.messages ?? []);
    setModel(data.model || "GPT-Image-1.5");
  }, []);

  useEffect(() => {
    void (async () => {
      const [health, modelRes] = await Promise.all([
        fetch("/api/health").then((r) => r.json()),
        fetch("/api/models").then((r) => r.json()),
      ]);
      setPoeConfigured(Boolean(health.poeConfigured));
      setModels(modelRes);
      setModel(modelRes.defaultModel || "GPT-Image-1.5");
      await refreshConversations();
    })();
  }, [refreshConversations]);

  async function ensureConversation(): Promise<string> {
    if (activeId) return activeId;
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: selectedModel }),
    });
    const data = await res.json();
    setActiveId(data.id);
    await refreshConversations();
    return data.id as string;
  }

  async function onNewChat() {
    setError(null);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: selectedModel }),
    });
    const data = await res.json();
    setActiveId(data.id);
    setMessages([]);
    await refreshConversations();
  }

  function appendGenerated(data: {
    assistantMessage?: Message;
    assets?: Array<{ id: string }>;
  }) {
    if (!data.assistantMessage) return;
    const msg = {
      ...data.assistantMessage,
      assetIds:
        data.assistantMessage.assetIds ??
        data.assets?.map((a) => a.id) ??
        [],
    };
    setMessages((prev) => [...prev, msg]);
  }

  async function sendChat(opts?: { skipClarification?: boolean }) {
    if (!prompt.trim() || busy || poeConfigured === false) return;
    setBusy(true);
    setError(null);
    try {
      const conversationId = await ensureConversation();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          prompt: prompt.trim(),
          skipClarification: Boolean(opts?.skipClarification),
          locale,
          model: selectedModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || t.chat.generateFailed);
      }
      setMessages((prev) => [
        ...prev,
        data.userMessage,
        data.assistantMessage,
      ]);
      if (data.generated?.assistantMessage) {
        appendGenerated(data.generated);
      }
      setPrompt("");
      await refreshConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.chat.generateFailed);
    } finally {
      setBusy(false);
    }
  }

  async function onGenerateNow(agentMessageId: string, imagePrompt: string) {
    if (!activeId || busy || generatingId) return;
    setGeneratingId(agentMessageId);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeId,
          prompt: imagePrompt,
          model: selectedModel,
          source: "confirm",
          agentMessageId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || t.chat.generateFailed);
      }
      if (data.userMessage) {
        setMessages((prev) => [...prev, data.userMessage]);
      }
      appendGenerated(data);
      await refreshConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.chat.generateFailed);
    } finally {
      setGeneratingId(null);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <aside className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-stone-700">{t.chat.sessions}</h2>
          <button
            type="button"
            onClick={() => void onNewChat()}
            className="rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-800 hover:bg-stone-200"
          >
            {t.chat.newSession}
          </button>
        </div>
        <ul className="space-y-1">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => void loadConversation(c.id)}
                className={`w-full truncate rounded-md px-2 py-1.5 text-left text-sm ${
                  activeId === c.id
                    ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                {c.title || t.chat.untitled}
              </button>
            </li>
          ))}
          {!conversations.length && (
            <li className="px-2 py-1 text-xs text-stone-400">
              {t.chat.emptySessions}
            </li>
          )}
        </ul>
      </aside>

      <section className="flex min-h-[70vh] flex-col rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 p-3">
          <label className="text-xs text-stone-500">{t.chat.model}</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="rounded-md border border-stone-300 bg-white px-2 py-1 text-sm text-stone-800"
          >
            {(models?.models || [])
              .filter((m) => m.enabled)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
          </select>
          {models?.allowCustomModelId && (
            <input
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              placeholder={t.chat.customModel}
              className="min-w-[180px] flex-1 rounded-md border border-stone-300 bg-white px-2 py-1 text-sm"
            />
          )}
          {poeConfigured === false && (
            <span className="text-xs text-rose-600">{t.chat.missingKey}</span>
          )}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((m) => {
            const meta = m.meta as AgentMetaView | null | undefined;
            const isAgent = m.role === "assistant" && meta?.kind === "agent_reply";
            return (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-amber-100 text-amber-950"
                    : "bg-stone-100 text-stone-800"
                }`}
              >
                {isAgent ? (
                  <AgentReplyCard
                    content={m.content}
                    meta={meta}
                    generating={generatingId === m.id}
                    onGenerate={(imagePrompt) =>
                      void onGenerateNow(m.id, imagePrompt)
                    }
                  />
                ) : (
                  <>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    {!!m.assetIds?.length && (
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {m.assetIds.map((id) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={id}
                            src={`/api/assets/${id}/file`}
                            alt={t.chat.imageAlt}
                            className="max-h-80 w-full rounded-md object-contain bg-stone-200/60"
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
          {!messages.length && (
            <p className="text-sm text-stone-400">{t.chat.emptyHint}</p>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendChat();
          }}
          className="border-t border-stone-200 p-3"
        >
          {error && <p className="mb-2 text-sm text-rose-600">{error}</p>}
          <div className="flex items-end gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              placeholder={t.chat.promptPlaceholder}
              className="flex-1 resize-none rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
              disabled={busy || Boolean(generatingId)}
            />
            <button
              type="button"
              onClick={() => void sendChat({ skipClarification: true })}
              disabled={
                busy ||
                Boolean(generatingId) ||
                !prompt.trim() ||
                poeConfigured === false
              }
              title={t.chat.skipClarification}
              className="h-10 shrink-0 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t.chat.skipClarification}
            </button>
            <button
              type="submit"
              disabled={
                busy ||
                Boolean(generatingId) ||
                !prompt.trim() ||
                poeConfigured === false
              }
              className="h-10 shrink-0 rounded-md bg-amber-500 px-4 text-sm font-medium text-stone-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? t.chat.thinking : t.chat.send}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
