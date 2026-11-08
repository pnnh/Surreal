"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/LocaleProvider";

export function FavoriteImage({
  assetId,
  src,
  alt,
  favorite: initialFavorite,
  className,
}: {
  assetId: string;
  src: string;
  alt: string;
  favorite: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const [favorite, setFavorite] = useState(initialFavorite);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    setPending(true);
    const next = !favorite;
    try {
      const res = await fetch(`/api/assets/${assetId}/favorite`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: next }),
      });
      if (res.ok) setFavorite(next);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={`relative overflow-hidden rounded-md ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-h-80 w-full object-contain bg-stone-200/60"
      />
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={pending}
        title={favorite ? t.assets.unfavorite : t.assets.favorite}
        aria-label={favorite ? t.assets.unfavorite : t.assets.favorite}
        className={`absolute bottom-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full border shadow-sm backdrop-blur transition ${
          favorite
            ? "border-amber-300 bg-amber-500 text-stone-950"
            : "border-stone-200 bg-white/90 text-stone-600 hover:bg-white"
        } disabled:opacity-50`}
      >
        <HeartIcon filled={favorite} className="h-4 w-4" />
      </button>
    </div>
  );
}

function HeartIcon({
  filled,
  className,
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s-6.5-4.35-9.33-8.5C.8 9.4 2.1 5.5 5.5 5.5c1.9 0 3.2 1.1 3.9 2.2.7-1.1 2-2.2 3.9-2.2 3.4 0 4.7 3.9 2.83 7C18.5 16.65 12 21 12 21z" />
    </svg>
  );
}
