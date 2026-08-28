import type { Subscription } from "@/core/types";
import { formatMoney } from "@/core/money";
import type { CurrencyCode } from "@/core/types";

const FIRED_KEY = "masareefy.reminders.fired";

interface FiredMap {
  [subscriptionId: string]: string;
}

function loadFired(): FiredMap {
  try {
    return JSON.parse(
      localStorage.getItem(FIRED_KEY) ?? "{}",
    ) as FiredMap;
  } catch {
    return {};
  }
}

function saveFired(map: FiredMap): void {
  localStorage.setItem(FIRED_KEY, JSON.stringify(map));
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function showSubscriptionReminder(
  sub: Subscription,
  currency: CurrencyCode = "EGP",
): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const amount =
    sub.amount != null ? formatMoney(sub.amount, currency) : "غير محدد";
  const body = `تجديد ${sub.title} — ${amount} — بتاريخ ${sub.nextRenewalDate}`;

  new Notification("مصاريفي — تذكير اشتراك", {
    body,
    icon: "/icons/icon-192.png",
    tag: `sub-${sub.id}-${sub.nextRenewalDate}`,
  });
}

export function shouldFireReminder(
  sub: Subscription,
  fireDate: string,
): boolean {
  const fired = loadFired();
  const key = `${sub.id}:${fireDate}`;
  return fired[key] !== fireDate;
}

export function markReminderFired(
  sub: Subscription,
  fireDate: string,
): void {
  const fired = loadFired();
  fired[`${sub.id}:${fireDate}`] = fireDate;
  saveFired(fired);
}
