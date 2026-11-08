"use client";

import { useI18n } from "@/lib/i18n/LocaleProvider";

type PageKey = "chat" | "assets" | "settings";

export function PageHeader({ page }: { page: PageKey }) {
  const { t } = useI18n();
  const copy = t[page];
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
        {copy.title}
      </h1>
      <p className="text-sm text-stone-500">{copy.subtitle}</p>
    </div>
  );
}
