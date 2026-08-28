import { SUBSCRIPTION_TAG } from "./types";
import type { Expense, Subscription, SubscriptionCycle, SubscriptionDraft } from "./types";
import { todayISO, parseISODate, toISODate } from "./date-range";

export function isSubscriptionExpense(expense: Pick<Expense, "tags">): boolean {
  return (expense.tags ?? []).includes(SUBSCRIPTION_TAG);
}

export function nextRenewalFromDay(
  renewalDay: number,
  from: string = todayISO(),
): string {
  const day = Math.min(28, Math.max(1, renewalDay));
  const base = parseISODate(from);
  let candidate = new Date(base.getFullYear(), base.getMonth(), day);
  if (toISODate(candidate) < from) {
    candidate = new Date(base.getFullYear(), base.getMonth() + 1, day);
  }
  return toISODate(candidate);
}

export function advanceRenewalDate(
  current: string,
  cycle: SubscriptionCycle,
): string {
  const date = parseISODate(current);
  if (cycle === "weekly") {
    date.setDate(date.getDate() + 7);
  } else if (cycle === "monthly") {
    date.setMonth(date.getMonth() + 1);
  } else {
    date.setFullYear(date.getFullYear() + 1);
  }
  return toISODate(date);
}

export function reminderFireDate(
  renewalDate: string,
  daysBefore: number,
): string {
  const date = parseISODate(renewalDate);
  date.setDate(date.getDate() - Math.max(0, daysBefore));
  return toISODate(date);
}

export function subscriptionFromExpense(
  expense: Expense,
  partial: Partial<SubscriptionDraft> = {},
): SubscriptionDraft {
  const renewalDay = Number(expense.spentOn.slice(8, 10)) || 1;
  return {
    title: expense.itemName || "اشتراك",
    amount: expense.amount,
    cycle: "monthly",
    renewalDay,
    nextRenewalDate: nextRenewalFromDay(renewalDay, expense.spentOn),
    expenseId: expense.id,
    notifyEnabled: false,
    notifyDaysBefore: 1,
    notifyTime: "09:00",
    active: true,
    notes: expense.notes,
    ...partial,
  };
}

export function sortSubscriptionsByRenewal(
  items: Subscription[],
): Subscription[] {
  return [...items].sort((a, b) =>
    a.nextRenewalDate.localeCompare(b.nextRenewalDate),
  );
}

export function subscriptionsDueForReminder(
  items: Subscription[],
  now: Date = new Date(),
): Subscription[] {
  const today = toISODate(now);
  const hour = now.getHours();
  const minute = now.getMinutes();
  const nowMinutes = hour * 60 + minute;

  return items.filter((sub) => {
    if (!sub.active || !sub.notifyEnabled) return false;
    const fireDate = reminderFireDate(sub.nextRenewalDate, sub.notifyDaysBefore);
    if (fireDate !== today) return false;
    const [h, m] = sub.notifyTime.split(":").map(Number);
    const target = (h ?? 9) * 60 + (m ?? 0);
    return nowMinutes >= target;
  });
}
