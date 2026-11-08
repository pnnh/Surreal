"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/LocaleProvider";

type Profile = {
  id: string;
  systemPrompt: string;
  defaultModel: string;
  updatedAt: string;
};

type ModelAllowlist = {
  defaultModel: string;
  models: Array<{ id: string; label: string; enabled: boolean }>;
};

export function ProfileForm() {
  const { t, locale } = useI18n();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [models, setModels] = useState<ModelAllowlist | null>(null);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [defaultModel, setDefaultModel] = useState("GPT-Image-1.5");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [p, m] = await Promise.all([
        fetch("/api/profile").then((r) => r.json()),
        fetch("/api/models").then((r) => r.json()),
      ]);
      setProfile(p);
      setModels(m);
      setSystemPrompt(p.systemPrompt ?? "");
      setDefaultModel(p.defaultModel || m.defaultModel);
    })();
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setError(null);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemPrompt, defaultModel }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error?.message || t.settings.saveFailed);
      return;
    }
    setProfile(data);
    setStatus(t.settings.saved);
  }

  function onReset() {
    setSystemPrompt("");
    setDefaultModel(models?.defaultModel || "GPT-Image-1.5");
  }

  return (
    <form
      onSubmit={onSave}
      className="max-w-2xl space-y-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
    >
      <div className="space-y-2">
        <label className="block text-sm text-stone-700">
          {t.settings.systemPrompt}
        </label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={8}
          placeholder={t.settings.systemPromptPlaceholder}
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm text-stone-700">
          {t.settings.defaultModel}
        </label>
        <select
          value={defaultModel}
          onChange={(e) => setDefaultModel(e.target.value)}
          className="rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm"
        >
          {(models?.models || [])
            .filter((m) => m.enabled)
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
        </select>
      </div>
      {profile && (
        <p className="text-xs text-stone-500">
          {t.settings.lastUpdated}{" "}
          {new Date(profile.updatedAt).toLocaleString(
            locale === "zh" ? "zh-CN" : "en",
          )}
        </p>
      )}
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {status && <p className="text-sm text-emerald-700">{status}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-stone-950 hover:bg-amber-400"
        >
          {t.settings.save}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md bg-stone-100 px-4 py-2 text-sm text-stone-800 hover:bg-stone-200"
        >
          {t.settings.reset}
        </button>
      </div>
    </form>
  );
}
