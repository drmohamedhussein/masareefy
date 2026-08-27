import { parseISODate, toISODate } from "./date-range";
import { roundMoney } from "./money";
import type { DailyBucket, Expense } from "./types";

export interface CalendarDayCell {
  date: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  total: number;
  count: number;
}

export function buildMonthGrid(
  year: number,
  monthIndex: number,
  expenses: Expense[],
  today: string = toISODate(new Date()),
): CalendarDayCell[] {
  const first = new Date(year, monthIndex, 1);
  const startOffset = first.getDay(); // Sunday = 0
  const gridStart = new Date(year, monthIndex, 1 - startOffset);
  const totals = new Map<string, DailyBucket>();

  for (const expense of expenses) {
    const bucket = totals.get(expense.spentOn) ?? {
      date: expense.spentOn,
      total: 0,
      count: 0,
    };
    if (expense.amount != null) {
      bucket.total = roundMoney(bucket.total + expense.amount);
    }
    bucket.count += 1;
    totals.set(expense.spentOn, bucket);
  }

  const cells: CalendarDayCell[] = [];
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    const iso = toISODate(day);
    const stats = totals.get(iso);
    cells.push({
      date: iso,
      inCurrentMonth: day.getMonth() === monthIndex,
      isToday: iso === today,
      total: stats?.total ?? 0,
      count: stats?.count ?? 0,
    });
  }

  return cells;
}

export function shiftMonth(isoDay: string, delta: number): { year: number; monthIndex: number } {
  const date = parseISODate(isoDay);
  date.setDate(1);
  date.setMonth(date.getMonth() + delta);
  return { year: date.getFullYear(), monthIndex: date.getMonth() };
}

export function monthLabelAr(year: number, monthIndex: number): string {
  const date = new Date(year, monthIndex, 1);
  return new Intl.DateTimeFormat("ar-EG", {
    month: "long",
    year: "numeric",
  }).format(date);
}
