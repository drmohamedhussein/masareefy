"use client";

import { useEffect } from "react";
import { subscriptionsDueForReminder, reminderFireDate } from "@/core/subscriptions";
import type { CurrencyCode } from "@/core/types";
import { useExpenses } from "@/components/expenses/expenses-provider";
import {
  markReminderFired,
  shouldFireReminder,
  showSubscriptionReminder,
} from "@/lib/notifications/reminder-engine";

const POLL_MS = 60_000;

export function ReminderScheduler() {
  const { subscriptions, profile } = useExpenses();
  const currency = (profile?.currency ?? "EGP") as CurrencyCode;

  useEffect(() => {
    const tick = () => {
      const due = subscriptionsDueForReminder(subscriptions);
      for (const sub of due) {
        const fireDate = reminderFireDate(
          sub.nextRenewalDate,
          sub.notifyDaysBefore,
        );
        if (!shouldFireReminder(sub, fireDate)) continue;
        showSubscriptionReminder(sub, currency);
        markReminderFired(sub, fireDate);
      }
    };

    tick();
    const id = window.setInterval(tick, POLL_MS);
    return () => window.clearInterval(id);
  }, [subscriptions, currency]);

  return null;
}
