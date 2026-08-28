import { expensePrimaryAmount } from "./currency";
import { daysInRange, eachDayInclusive, isDateInRange } from "./date-range";
import { roundMoney, sumAmounts } from "./money";
import type { AnalyticsSummary, CurrencyCode, DateRange, DailyBucket, Expense } from "./types";

function primaryAmounts(
  expenses: Expense[],
  primaryCurrency: CurrencyCode,
): Array<number | null> {
  return expenses.map((e) => expensePrimaryAmount(e, primaryCurrency));
}

export function buildDailyBuckets(
  expenses: Expense[],
  range: DateRange,
  primaryCurrency: CurrencyCode = "EGP",
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
      const primary = expensePrimaryAmount(expense, primaryCurrency);
      if (primary != null) {
        bucket.total = roundMoney(bucket.total + primary);
      }
    }
    bucket.count += 1;
  }

  return Array.from(map.values());
}

export function summarizeByTag(
  expenses: Expense[],
  primaryCurrency: CurrencyCode = "EGP",
): Array<{
  tag: string;
  total: number;
  count: number;
}> {
  const map = new Map<string, { total: number; count: number }>();
  for (const expense of expenses) {
    const tags = expense.tags?.length ? expense.tags : ["بدون وسم"];
    for (const tag of tags) {
      const current = map.get(tag) ?? { total: 0, count: 0 };
      current.count += 1;
      if (expense.amount != null) {
        const primary = expensePrimaryAmount(expense, primaryCurrency);
        if (primary != null) {
          current.total = roundMoney(current.total + primary);
        }
      }
      map.set(tag, current);
    }
  }
  return Array.from(map.entries())
    .map(([tag, stats]) => ({ tag, ...stats }))
    .sort((a, b) => b.total - a.total);
}

export function summarizeAnalytics(
  expenses: Expense[],
  range: DateRange,
  primaryCurrency: CurrencyCode = "EGP",
): AnalyticsSummary {
  const inRange = expenses.filter((expense) => isDateInRange(expense.spentOn, range));
  const dailySpending = buildDailyBuckets(inRange, range, primaryCurrency);
  const totalSpent = sumAmounts(primaryAmounts(inRange, primaryCurrency));
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
    byTag: summarizeByTag(inRange, primaryCurrency),
  };
}

export function totalForExpenses(
  expenses: Expense[],
  primaryCurrency: CurrencyCode = "EGP",
): {
  count: number;
  total: number;
} {
  return {
    count: expenses.length,
    total: sumAmounts(primaryAmounts(expenses, primaryCurrency)),
  };
}

export function budgetProgress(
  totalSpent: number,
  monthlyBudget: number | null,
): { ratio: number; remaining: number | null; over: boolean } {
  if (monthlyBudget == null || monthlyBudget <= 0) {
    return { ratio: 0, remaining: null, over: false };
  }
  const ratio = totalSpent / monthlyBudget;
  return {
    ratio,
    remaining: roundMoney(monthlyBudget - totalSpent),
    over: totalSpent > monthlyBudget,
  };
}
