/**
 * Domain types — pure, framework-free.
 * Portable for WordPress plugin + Android + Notion/Sheets sync.
 */

export type CurrencyCode =
  | "EGP"
  | "USD"
  | "EUR"
  | "GBP"
  | "SAR"
  | "AED"
  | "KWD"
  | "QAR"
  | "BHD"
  | "OMR"
  | "JOD"
  | "TRY"
  | "CAD"
  | "AUD"
  | "CHF"
  | "INR";

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

export const SUBSCRIPTION_TAG = "اشتراكات" as const;

export type UserRole = "admin" | "user";

export type SubscriptionCycle = "weekly" | "monthly" | "yearly";

export type LocaleCode = "en" | "ar";

export interface Profile {
  id: string;
  displayName: string | null;
  email: string | null;
  role: UserRole;
  locale: LocaleCode;
  /** Primary / preferred currency for totals and budget */
  currency: CurrencyCode;
  /** Currencies available when logging expenses */
  enabledCurrencies: CurrencyCode[];
  /**
   * Exchange rate to primary: primary = amount × rate.
   * Only applies to NEW expenses after the rate changes.
   */
  exchangeRates: Partial<Record<CurrencyCode, number>>;
  timezone: string;
  /** حد الميزانية الشهرية بالجنيه — null = بدون حد */
  monthlyBudget: number | null;
  /** PIN مشفّر بسيط لدخول الأدمن — null = لم يُضبط بعد */
  adminPinHash: string | null;
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
  /** Currency of this row's amount */
  currency: CurrencyCode;
  /** Rate to primary at creation / last currency change */
  exchangeRateSnapshot: number;
  /** ربط باشتراك عند تصنيف «اشتراكات» */
  subscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseDraft {
  amount: number | null;
  itemName: string;
  tags?: string[];
  notes?: string | null;
  spentOn: string;
  currency?: CurrencyCode;
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

/** اشتراك / تجديد — مرتبط بمصروف أو مستقل */
export interface Subscription {
  id: string;
  title: string;
  amount: number | null;
  cycle: SubscriptionCycle;
  /** يوم التجديد الشهري 1–28 */
  renewalDay: number;
  /** تاريخ التجديد القادم YYYY-MM-DD */
  nextRenewalDate: string;
  expenseId: string | null;
  notifyEnabled: boolean;
  /** 0 = نفس اليوم، 1 = قبل يوم، 3 = قبل 3 أيام */
  notifyDaysBefore: number;
  /** وقت التذكير HH:mm */
  notifyTime: string;
  googleCalendarEventId: string | null;
  active: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionDraft {
  title: string;
  amount?: number | null;
  cycle?: SubscriptionCycle;
  renewalDay?: number;
  nextRenewalDate?: string;
  expenseId?: string | null;
  notifyEnabled?: boolean;
  notifyDaysBefore?: number;
  notifyTime?: string;
  googleCalendarEventId?: string | null;
  active?: boolean;
  notes?: string | null;
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
