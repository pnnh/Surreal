"use client";

import { useI18n } from "@/lib/i18n/LocaleProvider";

export type AgentMetaView = {
  kind?: string;
  intent?: string;
  subagentType?: "image" | "icon" | "svg" | "model" | "3d";
  taskId?: string;
  taskStatus?: string;
  clarifyingQuestions?: string[];
  suggestedPrompt?: string;
  suggestedSizes?: number[];
  modelCategory?: string;
  modelStyle?: string;
  readyToGenerate?: boolean;
  assumptions?: string[];
};

export function AgentReplyCard({
  content,
  meta,
  onGenerate,
  generating,
}: {
  content: string;
  meta?: AgentMetaView | null;
  onGenerate?: (prompt: string, sizes?: number[]) => void;
  generating?: boolean;
}) {
  const { t } = useI18n();
  const questions = meta?.clarifyingQuestions?.filter(Boolean) ?? [];
  const suggested = meta?.suggestedPrompt?.trim() ?? "";
  const sizes = (meta?.suggestedSizes ?? []).filter(
    (n) => typeof n === "number" && n > 0,
  );
  const assumptions = meta?.assumptions?.filter(Boolean) ?? [];
  const ready = Boolean(meta?.readyToGenerate && suggested);

  const specialistBadge =
    meta?.subagentType === "icon"
      ? t.chat.specialistIcon
      : meta?.subagentType === "svg"
        ? t.chat.specialistSvg
        : meta?.subagentType === "model" || meta?.subagentType === "3d"
          ? t.chat.specialistModel
          : meta?.subagentType === "image"
            ? t.chat.specialistImage
            : null;

  return (
    <div className="space-y-3">
      {specialistBadge && (
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {specialistBadge}
          </span>
        </div>
      )}

      <p className="whitespace-pre-wrap">{content}</p>

      {questions.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-500">
            {t.chat.clarifyingQuestions}
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-stone-700">
            {questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {suggested && (
        <div className="rounded-md border border-stone-200 bg-stone-50 p-2">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-500">
            {t.chat.suggestedPrompt}
          </p>
          <p className="whitespace-pre-wrap text-sm text-stone-800">{suggested}</p>
        </div>
      )}

      {(meta?.modelCategory || meta?.modelStyle) && (
        <div className="flex items-center gap-2 text-xs">
          {meta.modelCategory && (
            <span className="rounded-md border border-stone-200 bg-stone-100 px-2 py-0.5 text-stone-700">
              {t.chat.modelCategory}: <strong className="font-medium text-stone-900">{meta.modelCategory}</strong>
            </span>
          )}
          {meta.modelStyle && (
            <span className="rounded-md border border-stone-200 bg-stone-100 px-2 py-0.5 text-stone-700">
              {t.chat.modelStyle}: <strong className="font-medium text-stone-900">{meta.modelStyle}</strong>
            </span>
          )}
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-500">
            {t.chat.suggestedSizes}
          </p>
          <p className="text-sm text-stone-700">
            {sizes.map((s) => `${s}×${s}`).join(", ")}
          </p>
        </div>
      )}

      {assumptions.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-500">
            {t.chat.assumptions}
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-stone-600">
            {assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {ready && onGenerate && (
        <button
          type="button"
          disabled={generating}
          onClick={() => onGenerate(suggested, sizes.length ? sizes : undefined)}
          className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-stone-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {generating ? t.chat.generating : t.chat.generateNow}
        </button>
      )}
    </div>
  );
}
