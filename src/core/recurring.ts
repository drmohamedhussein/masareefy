import type { Expense, ExpenseDraft, RecurringExpense } from "./types";
import { todayISO } from "./date-range";
import { normalizeTags } from "./export";

/**
 * Build drafts for active recurring items due on `date` that are not already logged.
 */
export function draftsDueToday(
  recurring: RecurringExpense[],
  existing: Expense[],
  date: string = todayISO(),
): ExpenseDraft[] {
  const day = Number(date.slice(8, 10));
  if (!Number.isFinite(day) || day < 1) return [];

  const already = new Set(
    existing
      .filter((e) => e.spentOn === date)
      .map((e) => `${e.itemName.trim()}|${(e.tags ?? []).join(",")}`),
  );

  const drafts: ExpenseDraft[] = [];
  for (const item of recurring) {
    if (!item.active) continue;
    if (item.dayOfMonth !== day) continue;
    const key = `${item.title.trim()}|${item.tags.join(",")}`;
    if (already.has(key)) continue;
    drafts.push({
      amount: item.amount,
      itemName: item.title,
      tags: normalizeTags(item.tags),
      notes: item.notes ?? "مصروف متكرر",
      spentOn: date,
    });
  }
  return drafts;
}
