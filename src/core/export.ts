import { filterExpenses } from "./expense-filters";
import { resolveDateRange } from "./date-range";
import type { DatePreset, Expense } from "./types";

export const EXPORT_HEADERS = [
  "التاريخ",
  "السعر",
  "اسم المشتريات",
  "ملاحظات",
  "المعرف",
] as const;

export type ExportScope = "all" | DatePreset | "custom";

export interface ExportOptions {
  scope: ExportScope;
  from?: string;
  to?: string;
}

export interface ExportRow {
  spentOn: string;
  amount: string;
  itemName: string;
  notes: string;
  id: string;
}

export function selectExpensesForExport(
  expenses: Expense[],
  options: ExportOptions,
): Expense[] {
  if (options.scope === "all") {
    return filterExpenses(expenses, {
      sortKey: "spentOn",
      sortDirection: "desc",
    });
  }

  const range =
    options.scope === "custom"
      ? resolveDateRange("custom", { from: options.from, to: options.to })
      : resolveDateRange(options.scope);

  return filterExpenses(expenses, {
    from: range.from,
    to: range.to,
    sortKey: "spentOn",
    sortDirection: "desc",
  });
}

export function toExportRows(expenses: Expense[]): ExportRow[] {
  return expenses.map((expense) => ({
    spentOn: expense.spentOn,
    amount: expense.amount == null ? "" : String(expense.amount),
    itemName: expense.itemName,
    notes: expense.notes ?? "",
    id: expense.id,
  }));
}

export function toSheetMatrix(expenses: Expense[]): string[][] {
  const rows = toExportRows(expenses);
  return [
    [...EXPORT_HEADERS],
    ...rows.map((row) => [
      row.spentOn,
      row.amount,
      row.itemName,
      row.notes,
      row.id,
    ]),
  ];
}

export function exportFilename(prefix: string, extension: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${prefix}-${stamp}.${extension}`;
}
