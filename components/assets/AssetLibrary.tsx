"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/LocaleProvider";

type AssetType = "image" | "icon";

type Asset = {
  id: string;
  prompt: string;
  model: string;
  favorite: boolean;
  assetType?: AssetType;
  width?: number | null;
  height?: number | null;
  createdAt: string;
  fileUrl: string;
};

type TypeFilter = "all" | AssetType;

export function AssetLibrary() {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<Asset[]>([]);
  const [onlyFavorite, setOnlyFavorite] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const params = new URLSearchParams();
    if (onlyFavorite) params.set("favorite", "true");
    if (typeFilter !== "all") params.set("type", typeFilter);
    const qs = params.toString() ? `?${params}` : "";
    const res = await fetch(`/api/assets${qs}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error?.message || t.assets.loadFailed);
      return;
    }
    setItems(data.items ?? []);
  }, [onlyFavorite, typeFilter, t.assets.loadFailed]);

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
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={onlyFavorite}
            onChange={(e) => setOnlyFavorite(e.target.checked)}
            className="rounded border-stone-300"
          />
          {t.assets.favoritesOnly}
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <span>{t.assets.typeFilter}</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="rounded-md border border-stone-300 bg-white px-2 py-1 text-sm"
          >
            <option value="all">{t.assets.typeAll}</option>
            <option value="image">{t.assets.typeImage}</option>
            <option value="icon">{t.assets.typeIcon}</option>
          </select>
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
              className={`w-full bg-[linear-gradient(45deg,#e7e5e4_25%,transparent_25%),linear-gradient(-45deg,#e7e5e4_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e7e5e4_75%),linear-gradient(-45deg,transparent_75%,#e7e5e4_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] ${
                asset.assetType === "icon"
                  ? "aspect-square object-contain p-6"
                  : "aspect-square object-cover"
              }`}
            />
            <div className="space-y-2 p-3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-stone-600">
                  {asset.assetType === "icon"
                    ? t.assets.typeIcon
                    : t.assets.typeImage}
                </span>
                {asset.width && asset.height ? (
                  <span className="text-[10px] text-stone-400">
                    {asset.width}×{asset.height}
                  </span>
                ) : null}
              </div>
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
