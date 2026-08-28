import type {
  Expense,
  ExpenseDraft,
  ExpenseQuery,
  Profile,
  RecurringExpense,
  Subscription,
  SubscriptionDraft,
} from "./types";

/**
 * Storage contract — Web / WordPress / Android implement the same semantics.
 */
export interface ExpenseRepository {
  listExpenses(query?: ExpenseQuery): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | null>;
  createExpense(draft: ExpenseDraft): Promise<Expense>;
  updateExpense(id: string, patch: Partial<ExpenseDraft>): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;
  upsertExpenses?(items: Expense[]): Promise<void>;
  getProfile(): Promise<Profile | null>;
  updateProfile(
    patch: Partial<
      Pick<
        Profile,
        | "displayName"
        | "email"
        | "role"
        | "currency"
        | "enabledCurrencies"
        | "exchangeRates"
        | "timezone"
        | "monthlyBudget"
        | "adminPinHash"
        | "locale"
      >
    >,
  ): Promise<Profile>;
  listRecurring?(): Promise<RecurringExpense[]>;
  saveRecurring?(items: RecurringExpense[]): Promise<void>;
  listSubscriptions?(): Promise<Subscription[]>;
  createSubscription?(draft: SubscriptionDraft): Promise<Subscription>;
  updateSubscription?(
    id: string,
    patch: Partial<SubscriptionDraft>,
  ): Promise<Subscription>;
  deleteSubscription?(id: string): Promise<void>;
}
