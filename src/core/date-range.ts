import type { DatePreset, DateRange } from "./types";

/** Parse YYYY-MM-DD as local calendar date (no UTC shift). */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}

function startOfWeekSunday(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - result.getDay());
  return result;
}

function endOfWeekSaturday(date: Date): Date {
  const start = startOfWeekSunday(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function resolveDateRange(
  preset: DatePreset,
  options?: { from?: string; to?: string; now?: Date },
): DateRange {
  const now = options?.now ?? new Date();
  const today = todayISO(now);

  switch (preset) {
    case "today":
      return { preset, from: today, to: today };
    case "this_week": {
      return {
        preset,
        from: toISODate(startOfWeekSunday(now)),
        to: toISODate(endOfWeekSaturday(now)),
      };
    }
    case "this_month": {
      return {
        preset,
        from: toISODate(startOfMonth(now)),
        to: toISODate(endOfMonth(now)),
      };
    }
    case "last_month": {
      const firstOfThisMonth = startOfMonth(now);
      const lastMonthEnd = new Date(firstOfThisMonth);
      lastMonthEnd.setDate(0);
      const lastMonthStart = startOfMonth(lastMonthEnd);
      return {
        preset,
        from: toISODate(lastMonthStart),
        to: toISODate(lastMonthEnd),
      };
    }
    case "custom": {
      const from = options?.from ?? today;
      const to = options?.to ?? today;
      return {
        preset,
        from: from <= to ? from : to,
        to: from <= to ? to : from,
      };
    }
    default: {
      const _exhaustive: never = preset;
      return _exhaustive;
    }
  }
}

export function isDateInRange(isoDate: string, range: DateRange): boolean {
  return isoDate >= range.from && isoDate <= range.to;
}

export function eachDayInclusive(from: string, to: string): string[] {
  const days: string[] = [];
  const cursor = parseISODate(from);
  const end = parseISODate(to);

  while (cursor <= end) {
    days.push(toISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export function daysInRange(range: DateRange): number {
  return eachDayInclusive(range.from, range.to).length;
}
