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
  DEFAULT_LOCALE,
  getDictionary,
  getStoredLocale,
  isLocale,
  persistLocale,
  type Dictionary,
  type Locale,
} from "@/lib/i18n";
import { getExpenseRepository } from "@/lib/storage/get-repository";

interface LocaleContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: Dictionary;
  setLocale: (locale: Locale) => Promise<void>;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      let initial = getStoredLocale();
      try {
        const profile = await getExpenseRepository().getProfile();
        if (profile?.locale && isLocale(profile.locale)) {
          initial = profile.locale;
        }
      } catch {
        /* local only */
      }
      setLocaleState(initial);
      persistLocale(initial);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale, ready]);

  const setLocale = useCallback(async (next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
    const repo = getExpenseRepository();
    await repo.updateProfile({ locale: next });
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dir: locale === "ar" ? "rtl" : "ltr",
      t: getDictionary(locale),
      setLocale,
    }),
    [locale, setLocale],
  );

  if (!ready) {
    return (
      <div className="min-h-screen bg-[var(--background)]" suppressHydrationWarning />
    );
  }

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useI18n(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}
