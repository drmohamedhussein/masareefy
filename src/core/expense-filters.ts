import type { Expense, ExpenseQuery, ExpenseSortKey, SortDirection } from "./types";
import { normalizeSpentOn } from "./spent-on";

function compareValues(
  a: string | number,
  b: string | number,
  direction: SortDirection,
): number {
  const base = a < b ? -1 : a > b ? 1 : 0;
  return direction === "asc" ? base : -base;
}

function getSortValue(expense: Expense, key: ExpenseSortKey): string | number {
  switch (key) {
    case "amount":
      return expense.amount ?? Number.NEGATIVE_INFINITY;
    case "itemName":
      return expense.itemName.toLocaleLowerCase("ar");
    case "spentOn":
      return expense.spentOn;
    case "tags":
      return (expense.tags ?? []).join(",").toLocaleLowerCase("ar");
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

export function filterExpenses(
  expenses: Expense[],
  query: ExpenseQuery = {},
): Expense[] {
  const search = query.search?.trim().toLocaleLowerCase("ar");
  const tag = query.tag?.trim();
  const sortKey = query.sortKey ?? "spentOn";
  const sortDirection = query.sortDirection ?? "desc";

  const filtered = expenses.filter((expense) => {
    const spentOn = normalizeSpentOn(expense.spentOn) ?? expense.spentOn;
    if (query.spentOn && spentOn !== query.spentOn) return false;
    if (query.from && spentOn < query.from) return false;
    if (query.to && spentOn > query.to) return false;
    if (tag && !(expense.tags ?? []).includes(tag)) return false;

    if (search) {
      const haystack =
        `${expense.itemName} ${expense.notes ?? ""} ${(expense.tags ?? []).join(" ")}`.toLocaleLowerCase(
          "ar",
        );
      if (!haystack.includes(search)) return false;
    }

    return true;
  });

  return filtered.sort((a, b) => {
    const primary = compareValues(
      getSortValue(a, sortKey),
      getSortValue(b, sortKey),
      sortDirection,
    );
    if (primary !== 0) return primary;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function withSequentialNumbers<T extends Expense>(
  expenses: T[],
): Array<T & { rowNumber: number }> {
  return expenses.map((expense, index) => ({
    ...expense,
    rowNumber: index + 1,
  }));
}
