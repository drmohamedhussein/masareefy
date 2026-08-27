import type { CurrencyCode } from "./types";

const CURRENCY_META: Record<
  CurrencyCode,
  { locale: string; symbol: string; currencyDisplay: "symbol" | "code" }
> = {
  EGP: { locale: "ar-EG", symbol: "ج.م", currencyDisplay: "symbol" },
  USD: { locale: "en-US", symbol: "$", currencyDisplay: "symbol" },
  SAR: { locale: "ar-SA", symbol: "ر.س", currencyDisplay: "symbol" },
  AED: { locale: "ar-AE", symbol: "د.إ", currencyDisplay: "symbol" },
  EUR: { locale: "de-DE", symbol: "€", currencyDisplay: "symbol" },
};

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function sumAmounts(amounts: Iterable<number | null | undefined>): number {
  let total = 0;
  for (const amount of amounts) {
    if (amount == null || !Number.isFinite(amount)) continue;
    total = roundMoney(total + amount);
  }
  return total;
}

export function formatMoney(
  amount: number,
  currency: CurrencyCode = "EGP",
  options?: { compact?: boolean },
): string {
  const meta = CURRENCY_META[currency];
  const formatted = new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency,
    currencyDisplay: meta.currencyDisplay,
    minimumFractionDigits: options?.compact ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

  // Intl for EGP often shows "ج.م." inconsistently — normalize display for UI.
  if (currency === "EGP") {
    return `${new Intl.NumberFormat("ar-EG", {
      minimumFractionDigits: options?.compact ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount)} ${meta.symbol}`;
  }

  return formatted;
}

export function parseAmountInput(raw: string): number | null {
  const normalized = raw
    .replace(/[^\d.,]/g, "")
    .replace(/,/g, ".")
    .trim();

  // فارغ = مسموح (null). قيم غير صالحة تُرفض من الطبقة الأعلى.
  if (!normalized) return null;

  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return roundMoney(value);
}

/** true إذا النص فاضي تمامًا (بعد التنظيف). */
export function isBlankAmountInput(raw: string): boolean {
  return raw.replace(/[^\d.,]/g, "").trim() === "";
}
