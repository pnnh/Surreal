"use client";

import { useI18n } from "@/lib/i18n/LocaleProvider";
import type { Locale } from "@/lib/i18n/messages";

const options: Array<{ id: Locale; label: string }> = [
  { id: "en", label: "EN" },
  { id: "zh", label: "中文" },
];

export function LanguageSwitcher() {
  const { locale, setLocale, t, ready } = useI18n();

  return (
    <div
      className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white p-0.5"
      role="group"
      aria-label={t.nav.language}
    >
      {options.map((opt) => {
        const active = ready && locale === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setLocale(opt.id)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              active
                ? "bg-amber-500 text-stone-950"
                : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
