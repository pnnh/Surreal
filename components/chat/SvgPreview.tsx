"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/LocaleProvider";

export function SvgPreview({
  assetId,
  src,
  favorite: initialFavorite,
}: {
  assetId: string;
  src: string;
  favorite: boolean;
}) {
  const { t } = useI18n();
  const [markup, setMarkup] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [color, setColor] = useState("#1c1917");
  const [size, setSize] = useState(64);
  const [favorite, setFavorite] = useState(initialFavorite);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(src);
        const text = await res.text();
        if (!res.ok) throw new Error("load failed");
        if (!cancelled) setMarkup(text);
      } catch {
        if (!cancelled) setError(t.chat.svgLoadFailed);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src, t.chat.svgLoadFailed]);

  async function toggleFavorite() {
    const next = !favorite;
    const res = await fetch(`/api/assets/${assetId}/favorite`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorite: next }),
    });
    if (res.ok) setFavorite(next);
  }

  return (
    <div className="space-y-2 rounded-lg border border-stone-200 bg-white p-3">
      <div
        className="flex items-center justify-center rounded-md bg-[linear-gradient(45deg,#e7e5e4_25%,transparent_25%),linear-gradient(-45deg,#e7e5e4_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e7e5e4_75%),linear-gradient(-45deg,transparent_75%,#e7e5e4_75%)] bg-[length:12px_12px] bg-[position:0_0,0_6px,6px_-6px,-6px_0] p-4"
        style={{ color, minHeight: size + 24 }}
      >
        {markup ? (
          <div
            className="[&>svg]:h-full [&>svg]:w-full"
            style={{ width: size, height: size, color }}
            // Sanitized server-side before persist; preview is local trusted asset.
            dangerouslySetInnerHTML={{ __html: markup }}
          />
        ) : (
          <p className="text-xs text-stone-500">
            {error || t.chat.generating}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
        <label className="flex items-center gap-1">
          {t.chat.svgColor}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-6 w-8 cursor-pointer rounded border border-stone-300"
          />
        </label>
        <label className="flex items-center gap-1">
          {t.chat.svgSize}
          <input
            type="range"
            min={24}
            max={128}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
          <span>{size}px</span>
        </label>
        <button
          type="button"
          onClick={() => void toggleFavorite()}
          className="rounded-md bg-stone-100 px-2 py-1 hover:bg-stone-200"
        >
          {favorite ? t.assets.unfavorite : t.assets.favorite}
        </button>
        <a
          href={src}
          download
          className="rounded-md bg-stone-100 px-2 py-1 hover:bg-stone-200"
        >
          {t.chat.svgDownload}
        </a>
      </div>
    </div>
  );
}
