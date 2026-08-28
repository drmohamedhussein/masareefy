import { roundMoney } from "./money";
import type { CurrencyCode, Expense, Profile } from "./types";

/** All currencies users can enable in settings. */
export const ALL_CURRENCIES = [
  "EGP",
  "USD",
  "EUR",
  "GBP",
  "SAR",
  "AED",
  "KWD",
  "QAR",
  "BHD",
  "OMR",
  "JOD",
  "TRY",
  "CAD",
  "AUD",
  "CHF",
  "INR",
] as const satisfies readonly CurrencyCode[];

export function isCurrencyCode(value: string): value is CurrencyCode {
  return (ALL_CURRENCIES as readonly string[]).includes(value);
}

export function normalizeEnabledCurrencies(
  codes: CurrencyCode[] | undefined,
  primary: CurrencyCode,
): CurrencyCode[] {
  const set = new Set<CurrencyCode>([primary]);
  for (const code of codes ?? []) {
    if (isCurrencyCode(code)) set.add(code);
  }
  return [...set];
}

/** Rate stored on profile: primary amount per 1 unit of foreign currency. */
export function getProfileExchangeRate(
  profile: Pick<Profile, "currency" | "exchangeRates">,
  currency: CurrencyCode,
): number {
  if (currency === profile.currency) return 1;
  const rate = profile.exchangeRates?.[currency];
  if (rate == null || !Number.isFinite(rate) || rate <= 0) return 1;
  return rate;
}

/** Snapshot rate for a new or updated expense row. */
export function snapshotExchangeRate(
  profile: Pick<Profile, "currency" | "exchangeRates">,
  currency: CurrencyCode,
): number {
  return getProfileExchangeRate(profile, currency);
}

export function expensePrimaryAmount(
  expense: Expense,
  primary: CurrencyCode,
): number | null {
  if (expense.amount == null) return null;
  const expenseCurrency = expense.currency ?? primary;
  if (expenseCurrency === primary) return expense.amount;
  const rate = expense.exchangeRateSnapshot ?? 1;
  return roundMoney(expense.amount * rate);
}

export function formatCurrencyCode(code: CurrencyCode): string {
  return code;
}
