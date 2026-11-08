"use client";

import { useCallback, useEffect, useState } from "react";
import { FavoriteImage } from "@/components/chat/FavoriteImage";
import { useI18n } from "@/lib/i18n/LocaleProvider";

type Conversation = {
  id: string;
  title: string | null;
  model: string;
  updatedAt: string;
};

type Message = {
  id: string;
  role: string;
  content: string;
  assets?: Array<{ id: string; favorite: boolean; fileUrl: string }>;
};

type Detail = Conversation & { messages: Message[] };

export function McpSessionsPanel() {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/conversations?source=mcp");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error?.message || "Failed to load");
      return;
    }
    const list = (data.items ?? []) as Conversation[];
    setItems(list);
    setActiveId((current) => current ?? list[0]?.id ?? null);
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    const res = await fetch(`/api/conversations/${id}`);
    const data = await res.json();
    if (!res.ok) return;
    setDetail(data);
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (activeId) void loadDetail(activeId);
  }, [activeId, loadDetail]);

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <aside className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
          {t.mcp.readOnly}
        </p>
        <ul className="space-y-1">
          {items.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setActiveId(c.id)}
                className={`w-full truncate rounded-md px-2 py-1.5 text-left text-sm ${
                  activeId === c.id
                    ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                {c.title || t.mcp.session}
              </button>
            </li>
          ))}
          {!items.length && (
            <li className="px-2 py-1 text-xs text-stone-400">{t.mcp.empty}</li>
          )}
        </ul>
      </aside>

      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        {error && <p className="mb-2 text-sm text-rose-600">{error}</p>}
        {!detail && (
          <p className="text-sm text-stone-400">{t.mcp.empty}</p>
        )}
        {detail && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-stone-900">
                {detail.title || t.mcp.session}
              </h2>
              <p className="text-xs text-stone-500">
                {detail.model} ·{" "}
                {new Date(detail.updatedAt).toLocaleString(
                  locale === "zh" ? "zh-CN" : "en",
                )}
              </p>
            </div>
            <div className="space-y-3">
              {detail.messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-amber-50 text-amber-950"
                      : "bg-stone-50 text-stone-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {!!m.assets?.length && (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {m.assets.map((asset) => (
                        <FavoriteImage
                          key={asset.id}
                          assetId={asset.id}
                          src={asset.fileUrl}
                          alt={m.content.slice(0, 40)}
                          favorite={asset.favorite}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
