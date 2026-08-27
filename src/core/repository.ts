import type {
  Expense,
  ExpenseDraft,
  ExpenseQuery,
  Profile,
  RecurringExpense,
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
  getProfile(): Promise<Profile | null>;
  updateProfile(
    patch: Partial<
      Pick<Profile, "displayName" | "currency" | "timezone" | "monthlyBudget">
    >,
  ): Promise<Profile>;
  listRecurring?(): Promise<RecurringExpense[]>;
  saveRecurring?(items: RecurringExpense[]): Promise<void>;
}
