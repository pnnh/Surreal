"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AgentReplyCard,
  type AgentMetaView,
} from "@/components/chat/AgentReplyCard";
import { FavoriteImage } from "@/components/chat/FavoriteImage";
import { ModelViewer } from "@/components/chat/ModelViewer";
import { SvgPreview } from "@/components/chat/SvgPreview";
import { useI18n } from "@/lib/i18n/LocaleProvider";

import type { ConversationKind } from "@/lib/db/types";

type Conversation = {
  id: string;
  title: string | null;
  model: string;
  kind?: ConversationKind;
  updatedAt: string;
};

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  assetIds?: string[];
  assets?: Array<{
    id: string;
    favorite: boolean;
    fileUrl: string;
    assetType?: ConversationKind | "image" | "icon" | "svg";
    mimeType?: string;
  }>;
  meta?: AgentMetaView | Record<string, unknown> | null;
};

function parseKind(value: unknown): ConversationKind {
  if (
    value === "general" ||
    value === "icon" ||
    value === "svg" ||
    value === "model" ||
    value === "image"
  ) {
    return value;
  }
  return "general";
}

export function ChatWorkspace() {
  const { t, locale } = useI18n();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeKind, setActiveKind] = useState<ConversationKind>("general");
  const [draftKind, setDraftKind] = useState<ConversationKind>("general");
  const [messages, setMessages] = useState<Message[]>([]);
  const [model, setModel] = useState("GPT-Image-1.5");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [poeConfigured, setPoeConfigured] = useState<boolean | null>(null);

  const refreshConversations = useCallback(async () => {
    const res = await fetch("/api/conversations");
    const data = (await res.json().catch(() => ({}))) as {
      items?: Conversation[];
      error?: { message?: string };
    };
    if (!res.ok) {
      setError(data.error?.message || t.chat.generateFailed);
      return;
    }
    setConversations(data.items ?? []);
  }, [t.chat.generateFailed]);

  const loadConversation = useCallback(async (id: string) => {
    const res = await fetch(`/api/conversations/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setActiveId(id);
    setActiveKind(parseKind(data.kind));
    setDraftKind(parseKind(data.kind));
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
      setModel(modelRes.defaultModel || "GPT-Image-1.5");
      await refreshConversations();
    })();
  }, [refreshConversations]);

  async function createConversation(
    kind: ConversationKind,
  ): Promise<Conversation> {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, kind }),
    });
    return (await res.json()) as Conversation;
  }

  async function ensureConversation(): Promise<string> {
    if (activeId) return activeId;
    const data = await createConversation(draftKind);
    setActiveId(data.id);
    setActiveKind(parseKind(data.kind ?? draftKind));
    await refreshConversations();
    return data.id as string;
  }

  function onNewChat(kind: ConversationKind = draftKind) {
    setError(null);
    setActiveId(null);
    setActiveKind(kind);
    setDraftKind(kind);
    setMessages([]);
  }

  async function deleteChat(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(t.chat.deleteSessionConfirm)) return;
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete conversation");
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
      await refreshConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
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
          model,
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

  async function onGenerateNow(
    agentMessageId: string,
    imagePrompt: string,
    sizes?: number[],
    assetType?: string,
  ) {
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
          model,
          source: "confirm",
          agentMessageId,
          sizes: sizes && sizes.length > 0 ? sizes : undefined,
          assetType,
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

  const kindLabel = (kind?: ConversationKind) =>
    kind === "general"
      ? t.chat.kindGeneral
      : kind === "icon"
        ? t.chat.kindIcon
        : kind === "svg"
          ? t.chat.kindSvg
          : kind === "model"
            ? t.chat.kindModel
            : t.chat.kindImage;

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <aside className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
        <div className="mb-3 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-stone-700">
              {t.chat.sessions}
            </h2>
            <button
              type="button"
              onClick={() => void onNewChat("general")}
              className="rounded-md bg-amber-500 px-2 py-1 text-xs font-medium text-stone-950 hover:bg-amber-400"
            >
              + {t.chat.newSession}
            </button>
          </div>
        </div>
        <ul className="space-y-1">
          {conversations.map((c) => (
            <li
              key={c.id}
              className={`group flex items-center justify-between rounded-md transition-colors ${
                activeId === c.id
                  ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              <button
                type="button"
                onClick={() => void loadConversation(c.id)}
                className="flex-1 truncate px-2 py-1.5 text-left text-sm"
              >
                <span className="mr-1 text-[10px] uppercase tracking-wide text-stone-400">
                  {kindLabel(c.kind)}
                </span>
                {c.title || t.chat.untitled}
              </button>
              <button
                type="button"
                onClick={(e) => void deleteChat(c.id, e)}
                title={t.chat.deleteSession}
                className="mr-1 hidden rounded p-1 text-stone-400 hover:bg-stone-200 hover:text-rose-600 group-hover:block"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
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
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 p-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {t.chat.coordinatorBadge}
            </span>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
              {kindLabel(activeId ? activeKind : draftKind)}
            </span>
          </div>
          {poeConfigured === false && (
            <span className="text-xs text-rose-600">{t.chat.missingKey}</span>
          )}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((m) => {
            const meta = m.meta as AgentMetaView | null | undefined;
            const isAgent =
              m.role === "assistant" &&
              (meta?.kind === "agent_reply" ||
                meta?.kind === "coordinator_reply");
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
                    onGenerate={(imagePrompt, sizes) =>
                      void onGenerateNow(
                        m.id,
                        imagePrompt,
                        sizes,
                        meta?.subagentType,
                      )
                    }
                  />
                ) : (
                  <>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    {!!(m.assets?.length || m.assetIds?.length) && (
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {(m.assets?.length
                          ? m.assets
                          : (m.assetIds ?? []).map((id) => ({
                              id,
                              favorite: false,
                              fileUrl: `/api/assets/${id}/file`,
                              assetType: activeKind,
                              mimeType:
                                activeKind === "svg"
                                  ? "image/svg+xml"
                                  : activeKind === "model"
                                    ? "model/gltf-binary"
                                    : undefined,
                            }))
                        ).map((asset) =>
                          asset.assetType === "model" ||
                          asset.mimeType === "model/gltf-binary" ? (
                            <div key={asset.id} className="sm:col-span-2">
                              <ModelViewer
                                src={asset.fileUrl}
                                alt={m.content?.slice(0, 40) || "3D Model"}
                              />
                            </div>
                          ) : asset.assetType === "svg" ||
                          asset.mimeType === "image/svg+xml" ? (
                            <SvgPreview
                              key={asset.id}
                              assetId={asset.id}
                              src={asset.fileUrl}
                              favorite={asset.favorite}
                            />
                          ) : (
                            <FavoriteImage
                              key={asset.id}
                              assetId={asset.id}
                              src={asset.fileUrl}
                              alt={t.chat.imageAlt}
                              favorite={asset.favorite}
                            />
                          ),
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
          {!messages.length && (
            <p className="text-sm text-stone-400">
              {(activeId ? activeKind : draftKind) === "icon"
                ? t.chat.emptyHintIcon
                : (activeId ? activeKind : draftKind) === "svg"
                  ? t.chat.emptyHintSvg
                  : (activeId ? activeKind : draftKind) === "image"
                    ? t.chat.emptyHint
                    : t.chat.emptyHintGeneral}
            </p>
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
              placeholder={
                (activeId ? activeKind : draftKind) === "icon"
                  ? t.chat.promptPlaceholderIcon
                  : (activeId ? activeKind : draftKind) === "svg"
                    ? t.chat.promptPlaceholderSvg
                    : (activeId ? activeKind : draftKind) === "image"
                      ? t.chat.promptPlaceholder
                      : t.chat.promptPlaceholderGeneral
              }
              className="flex-1 resize-none rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
              disabled={busy || Boolean(generatingId)}
            />
            <button
              type="button"
              onClick={() => {
                if (!window.confirm(t.chat.skipClarificationConfirm)) return;
                void sendChat({ skipClarification: true });
              }}
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
