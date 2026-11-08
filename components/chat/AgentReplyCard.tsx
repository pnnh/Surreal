"use client";

import { useI18n } from "@/lib/i18n/LocaleProvider";

export type AgentMetaView = {
  kind?: string;
  clarifyingQuestions?: string[];
  suggestedPrompt?: string;
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
  onGenerate?: (prompt: string) => void;
  generating?: boolean;
}) {
  const { t } = useI18n();
  const questions = meta?.clarifyingQuestions?.filter(Boolean) ?? [];
  const suggested = meta?.suggestedPrompt?.trim() ?? "";
  const assumptions = meta?.assumptions?.filter(Boolean) ?? [];
  const ready = Boolean(meta?.readyToGenerate && suggested);

  return (
    <div className="space-y-3">
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
          onClick={() => onGenerate(suggested)}
          className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-stone-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {generating ? t.chat.generating : t.chat.generateNow}
        </button>
      )}
    </div>
  );
}
