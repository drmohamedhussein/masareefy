import type { Expense, ExpenseDraft, ExpenseQuery, Profile } from "./types";

/**
 * Storage contract shared by web (Supabase / local) and future WordPress plugin.
 * Implement this interface in PHP later with the same method semantics.
 */
export interface ExpenseRepository {
  listExpenses(query?: ExpenseQuery): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | null>;
  createExpense(draft: ExpenseDraft): Promise<Expense>;
  updateExpense(id: string, patch: Partial<ExpenseDraft>): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;
  getProfile(): Promise<Profile | null>;
  updateProfile(patch: Partial<Pick<Profile, "displayName" | "currency" | "timezone">>): Promise<Profile>;
}
