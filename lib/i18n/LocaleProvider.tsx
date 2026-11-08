"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  detectBrowserLocale,
  isLocale,
  LOCALE_STORAGE_KEY,
  messages,
  type Locale,
  type Messages,
} from "./messages";

type LocaleContextValue = {
  locale: Locale;
  t: Messages;
  setLocale: (locale: Locale) => void;
  ready: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    const next = isLocale(stored) ? stored : detectBrowserLocale();
    setLocaleState(next);
    document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
    setReady(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
  }, []);

  const value = useMemo(
    () => ({
      locale,
      t: messages[locale],
      setLocale,
      ready,
    }),
    [locale, setLocale, ready],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useI18n(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useI18n must be used within LocaleProvider");
  }
  return ctx;
}
