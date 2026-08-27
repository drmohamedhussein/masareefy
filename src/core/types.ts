/**
 * Domain types — pure, framework-free.
 * Portable for WordPress plugin + Android + Notion/Sheets sync.
 */

export type CurrencyCode = "EGP" | "USD" | "SAR" | "AED" | "EUR";

/** وسوم/تصنيفات جاهزة — قابلة للتصدير إلى Notion كـ Multi-select */
export const DEFAULT_TAGS = [
  "طعام",
  "مواصلات",
  "منزل",
  "فواتير",
  "صحة",
  "تعليم",
  "ترفيه",
  "تسوق",
  "اشتراكات",
  "أخرى",
] as const;

export type DefaultTag = (typeof DEFAULT_TAGS)[number];

export interface Profile {
  id: string;
  displayName: string | null;
  currency: CurrencyCode;
  timezone: string;
  /** حد الميزانية الشهرية بالجنيه — null = بدون حد */
  monthlyBudget: number | null;
  createdAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  /** null = خانة السعر فارغة */
  amount: number | null;
  itemName: string;
  /** التصنيف = وسوم (Notion-style tags) */
  tags: string[];
  notes: string | null;
  /** ISO date YYYY-MM-DD */
  spentOn: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseDraft {
  amount: number | null;
  itemName: string;
  tags?: string[];
  notes?: string | null;
  spentOn: string;
}

export interface RecurringExpense {
  id: string;
  title: string;
  amount: number | null;
  tags: string[];
  dayOfMonth: number;
  active: boolean;
  notes: string | null;
}

export type ExpenseSortKey = "amount" | "itemName" | "spentOn" | "tags";
export type SortDirection = "asc" | "desc";

export interface ExpenseQuery {
  search?: string;
  spentOn?: string;
  from?: string;
  to?: string;
  tag?: string;
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
  byTag: Array<{ tag: string; total: number; count: number }>;
}
