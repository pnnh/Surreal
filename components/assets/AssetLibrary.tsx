"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/LocaleProvider";

type Asset = {
  id: string;
  prompt: string;
  model: string;
  favorite: boolean;
  createdAt: string;
  fileUrl: string;
};

export function AssetLibrary() {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<Asset[]>([]);
  const [onlyFavorite, setOnlyFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const qs = onlyFavorite ? "?favorite=true" : "";
    const res = await fetch(`/api/assets${qs}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error?.message || t.assets.loadFailed);
      return;
    }
    setItems(data.items ?? []);
  }, [onlyFavorite, t.assets.loadFailed]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleFavorite(asset: Asset) {
    const res = await fetch(`/api/assets/${asset.id}/favorite`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorite: !asset.favorite }),
    });
    if (res.ok) await load();
  }

  async function onDelete(asset: Asset) {
    if (!window.confirm(t.assets.deleteConfirm)) return;
    const res = await fetch(`/api/assets/${asset.id}?confirm=true`, {
      method: "DELETE",
    });
    if (res.ok || res.status === 204) await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={onlyFavorite}
            onChange={(e) => setOnlyFavorite(e.target.checked)}
            className="rounded border-stone-300"
          />
          {t.assets.favoritesOnly}
        </label>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-md bg-stone-100 px-3 py-1 text-sm text-stone-800 hover:bg-stone-200"
        >
          {t.assets.refresh}
        </button>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((asset) => (
          <article
            key={asset.id}
            className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.fileUrl}
              alt={asset.prompt}
              className="aspect-square w-full object-cover bg-stone-100"
            />
            <div className="space-y-2 p-3">
              <p className="line-clamp-2 text-sm text-stone-800">{asset.prompt}</p>
              <p className="text-xs text-stone-500">
                {asset.model} ·{" "}
                {new Date(asset.createdAt).toLocaleString(
                  locale === "zh" ? "zh-CN" : "en",
                )}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void toggleFavorite(asset)}
                  className="rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-800 hover:bg-stone-200"
                >
                  {asset.favorite ? t.assets.unfavorite : t.assets.favorite}
                </button>
                <button
                  type="button"
                  onClick={() => void onDelete(asset)}
                  className="rounded-md bg-rose-50 px-2 py-1 text-xs text-rose-700 hover:bg-rose-100"
                >
                  {t.assets.delete}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!items.length && (
        <p className="text-sm text-stone-400">{t.assets.empty}</p>
      )}
    </div>
  );
}
