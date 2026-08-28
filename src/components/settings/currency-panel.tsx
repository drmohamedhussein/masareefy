"use client";

import { useEffect, useState } from "react";
import { ALL_CURRENCIES, isCurrencyCode, normalizeEnabledCurrencies } from "@/core/currency";
import { currencySymbol } from "@/core/money";
import type { CurrencyCode } from "@/core/types";
import { useExpenses } from "@/components/expenses/expenses-provider";
import { useI18n } from "@/components/providers/locale-provider";
import { getExpenseRepository } from "@/lib/storage/get-repository";

export function CurrencyPanel() {
  const { profile, refresh } = useExpenses();
  const { t } = useI18n();
  const primary = (profile?.currency ?? "EGP") as CurrencyCode;
  const enabled = profile?.enabledCurrencies ?? [primary];
  const [rates, setRates] = useState<Partial<Record<CurrencyCode, string>>>({});

  useEffect(() => {
    const next: Partial<Record<CurrencyCode, string>> = {};
    for (const code of enabled) {
      if (code === primary) continue;
      const value = profile?.exchangeRates?.[code];
      next[code] = value != null ? String(value) : "";
    }
    setRates(next);
  }, [enabled, primary, profile?.exchangeRates]);

  const toggleCurrency = async (code: CurrencyCode) => {
    const repo = getExpenseRepository();
    const isEnabled = enabled.includes(code);
    const next = isEnabled
      ? enabled.filter((c) => c !== code)
      : [...enabled, code];
    const normalized = normalizeEnabledCurrencies(next, primary);
    await repo.updateProfile({ enabledCurrencies: normalized });
    await refresh();
  };

  const setPrimary = async (code: CurrencyCode) => {
    const repo = getExpenseRepository();
    await repo.updateProfile({
      currency: code,
      enabledCurrencies: normalizeEnabledCurrencies(enabled, code),
    });
    await refresh();
  };

  const saveRates = async () => {
    const repo = getExpenseRepository();
    const exchangeRates: Partial<Record<CurrencyCode, number>> = {};
    for (const [code, raw] of Object.entries(rates)) {
      if (!isCurrencyCode(code) || code === primary) continue;
      const value = Number(raw);
      if (Number.isFinite(value) && value > 0) {
        exchangeRates[code] = value;
      }
    }
    await repo.updateProfile({ exchangeRates });
    await refresh();
  };

  return (
    <section className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
      <h2 className="mb-1 font-medium">{t.settings.currencyPanelTitle}</h2>
      <p className="mb-4 text-sm text-[var(--muted-foreground)]">
        {t.settings.currencyPanelDesc}
      </p>

      <p className="mb-2 text-sm font-medium">{t.settings.primaryCurrency}</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {ALL_CURRENCIES.map((code) => (
          <button
            key={`primary-${code}`}
            type="button"
            onClick={() => void setPrimary(code)}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              primary === code
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-medium"
                : "border-[var(--border)] hover:bg-[var(--hover)]"
            }`}
          >
            {code} {currencySymbol(code)}
          </button>
        ))}
      </div>

      <p className="mb-2 text-sm font-medium">{t.settings.enabledCurrencies}</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {ALL_CURRENCIES.map((code) => {
          const on = enabled.includes(code);
          return (
            <button
              key={`enabled-${code}`}
              type="button"
              disabled={code === primary}
              onClick={() => void toggleCurrency(code)}
              className={`rounded-lg border px-3 py-1.5 text-sm disabled:opacity-60 ${
                on
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--border)] hover:bg-[var(--hover)]"
              }`}
            >
              {code}
            </button>
          );
        })}
      </div>

      {enabled.filter((c) => c !== primary).length > 0 && (
        <div className="space-y-3 border-t border-[var(--border)] pt-4">
          <p className="text-sm font-medium">{t.settings.exchangeRates}</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {t.settings.exchangeRatesHint}
          </p>
          {enabled
            .filter((c) => c !== primary)
            .map((code) => (
              <label key={code} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="min-w-[3rem] font-medium">{code}</span>
                <span className="text-[var(--muted)]">1 {code} =</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={rates[code] ?? ""}
                  onChange={(e) =>
                    setRates((prev) => ({ ...prev, [code]: e.target.value }))
                  }
                  className="w-28 rounded-lg border border-[var(--border)] px-2 py-1.5"
                />
                <span className="text-[var(--muted)]">{primary}</span>
              </label>
            ))}
          <button
            type="button"
            onClick={() => void saveRates()}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white"
          >
            {t.settings.saveRates}
          </button>
        </div>
      )}
    </section>
  );
}
