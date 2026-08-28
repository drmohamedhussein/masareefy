import { parseISODate, toISODate, todayISO } from "./date-range";

/** Normalize any date string to local YYYY-MM-DD for filtering. */
export function normalizeSpentOn(value: unknown): string | null {
  if (value == null) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const isoPrefix = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoPrefix) {
    return isoPrefix[1]!;
  }

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const a = Number(slash[1]);
    const b = Number(slash[2]);
    const year = Number(slash[3]);
    if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(year)) {
      return null;
    }
    const month = a > 12 ? b : a;
    const day = a > 12 ? a : b;
    return toISODate(new Date(year, month - 1, day));
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return toISODate(parsed);
  }

  try {
    return toISODate(parseISODate(raw));
  } catch {
    return null;
  }
}

export function resolveSpentOn(
  value: unknown,
  fallback: string = todayISO(),
): string {
  return normalizeSpentOn(value) ?? fallback;
}
