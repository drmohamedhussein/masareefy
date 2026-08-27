/**
 * Domain types — pure, framework-free.
 * Keep this layer portable for a future WordPress/PHP plugin port.
 */

export type CurrencyCode = "EGP" | "USD" | "SAR" | "AED" | "EUR";

export interface Profile {
  id: string;
  displayName: string | null;
  currency: CurrencyCode;
  timezone: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  /** null = خانة السعر فارغة */
  amount: number | null;
  itemName: string;
  notes: string | null;
  /** ISO date YYYY-MM-DD */
  spentOn: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseDraft {
  amount: number | null;
  itemName: string;
  notes?: string | null;
  spentOn: string;
}

export type ExpenseSortKey = "amount" | "itemName" | "spentOn";
export type SortDirection = "asc" | "desc";

export interface ExpenseQuery {
  search?: string;
  spentOn?: string;
  from?: string;
  to?: string;
  sortKey?: ExpenseSortKey;
  sortDirection?: SortDirection;
}

export type DatePreset =
  | "today"
  | "this_week"
  | "this_month"
  | "last_month"
  | "custom";

export interface DateRange {
  from: string;
  to: string;
  preset: DatePreset;
}

export interface DailyBucket {
  date: string;
  total: number;
  count: number;
}

export interface AnalyticsSummary {
  totalSpent: number;
  purchaseCount: number;
  dailyAverage: number;
  highestSpendingDay: DailyBucket | null;
  dailySpending: DailyBucket[];
  topExpenses: Expense[];
}
