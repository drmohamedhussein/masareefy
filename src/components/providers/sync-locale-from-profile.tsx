"use client";

import { useEffect } from "react";
import { useExpenses } from "@/components/expenses/expenses-provider";
import { useI18n } from "@/components/providers/locale-provider";

export function SyncLocaleFromProfile() {
  const { profile } = useExpenses();
  const { locale, setLocale } = useI18n();

  useEffect(() => {
    const next = profile?.locale;
    if (next && next !== locale) {
      void setLocale(next);
    }
  }, [profile?.locale, locale, setLocale]);

  return null;
}
