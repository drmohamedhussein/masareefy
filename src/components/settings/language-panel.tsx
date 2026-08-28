"use client";

import { useI18n } from "@/components/providers/locale-provider";
import type { Locale } from "@/lib/i18n";

export function LanguagePanel() {
  const { locale, setLocale, t } = useI18n();

  return (
    <section className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
      <h2 className="mb-1 font-medium">{t.settings.languageTitle}</h2>
      <p className="mb-4 text-sm text-[var(--muted-foreground)]">
        {t.settings.languageDesc}
      </p>
      <div className="flex flex-wrap gap-2">
        {(
          [
            { value: "en" as Locale, label: t.common.english },
            { value: "ar" as Locale, label: t.common.arabic },
          ] as const
        ).map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => void setLocale(value)}
            className={`rounded-lg border px-4 py-2 text-sm ${
              locale === value
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-medium"
                : "border-[var(--border)] hover:bg-[var(--hover)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
