import { daysInRange, eachDayInclusive, isDateInRange } from "./date-range";
import { roundMoney, sumAmounts } from "./money";
import type { AnalyticsSummary, DateRange, DailyBucket, Expense } from "./types";

export function buildDailyBuckets(
  expenses: Expense[],
  range: DateRange,
): DailyBucket[] {
  const map = new Map<string, DailyBucket>();

  for (const day of eachDayInclusive(range.from, range.to)) {
    map.set(day, { date: day, total: 0, count: 0 });
  }

  for (const expense of expenses) {
    if (!isDateInRange(expense.spentOn, range)) continue;
    const bucket = map.get(expense.spentOn);
    if (!bucket) continue;
    if (expense.amount != null) {
      bucket.total = roundMoney(bucket.total + expense.amount);
    }
    bucket.count += 1;
  }

  return Array.from(map.values());
}

export function summarizeAnalytics(
  expenses: Expense[],
  range: DateRange,
): AnalyticsSummary {
  const inRange = expenses.filter((expense) => isDateInRange(expense.spentOn, range));
  const dailySpending = buildDailyBuckets(inRange, range);
  const totalSpent = sumAmounts(inRange.map((e) => e.amount));
  const purchaseCount = inRange.length;
  const dayCount = Math.max(daysInRange(range), 1);
  const dailyAverage = roundMoney(totalSpent / dayCount);

  const peakDay = dailySpending.reduce<DailyBucket | null>((best, bucket) => {
    if (bucket.total <= 0) return best;
    if (!best || bucket.total > best.total) return bucket;
    return best;
  }, null);

  const topExpenses = [...inRange]
    .filter((expense) => expense.amount != null)
    .sort(
      (a, b) =>
        (b.amount ?? 0) - (a.amount ?? 0) || b.spentOn.localeCompare(a.spentOn),
    )
    .slice(0, 10);

  return {
    totalSpent,
    purchaseCount,
    dailyAverage,
    highestSpendingDay: peakDay,
    dailySpending,
    topExpenses,
  };
}

export function totalForExpenses(expenses: Expense[]): {
  count: number;
  total: number;
} {
  return {
    count: expenses.length,
    total: sumAmounts(expenses.map((e) => e.amount)),
  };
}
