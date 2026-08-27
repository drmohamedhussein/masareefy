import type { Expense } from "@/core/types";
import { syncExpensesToGoogleSheets } from "@/lib/google/sheets";
import { syncExpensesToNotion } from "@/lib/notion/sync";

/**
 * Push latest expenses to every connected destination (Sheets + Notion).
 * Failures are isolated so one provider never blocks the other.
 */
export async function syncExpensesEverywhere(expenses: Expense[]): Promise<void> {
  const results = await Promise.allSettled([
    syncExpensesToGoogleSheets(expenses),
    syncExpensesToNotion(expenses),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.warn("[masareefy sync]", result.reason);
    }
  }
}
