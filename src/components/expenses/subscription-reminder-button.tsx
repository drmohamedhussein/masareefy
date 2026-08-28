"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import type { Expense } from "@/core/types";
import { SUBSCRIPTION_TAG } from "@/core/types";
import { isSubscriptionExpense } from "@/core/subscriptions";
import { useExpenses } from "@/components/expenses/expenses-provider";
import {
  requestNotificationPermission,
} from "@/lib/notifications/reminder-engine";
import { cn } from "@/lib/utils";

interface SubscriptionReminderButtonProps {
  expense: Expense;
}

export function SubscriptionReminderButton({
  expense,
}: SubscriptionReminderButtonProps) {
  const {
    subscriptions,
    getSubscriptionForExpense,
    addSubscription,
    syncSubscriptionReminders,
    updateSubscription,
  } = useExpenses();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const isSubscription =
    isSubscriptionExpense(expense) ||
    expense.tags.includes(SUBSCRIPTION_TAG);
  const subscription =
    getSubscriptionForExpense(expense.id) ??
    subscriptions.find((s) => s.expenseId === expense.id) ??
    null;

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  if (!isSubscription) {
    return <span className="inline-block w-7" aria-hidden />;
  }

  const enabled = subscription?.notifyEnabled ?? false;

  const ensureSubscription = async () => {
    if (subscription) return subscription;
    return addSubscription({
      title: expense.itemName || "اشتراك",
      amount: expense.amount,
      expenseId: expense.id,
      renewalDay: Number(expense.spentOn.slice(8, 10)) || 1,
      notifyEnabled: false,
      notifyDaysBefore: 1,
      notifyTime: "09:00",
    });
  };

  const toggleNotifications = async () => {
    const sub = await ensureSubscription();
    const next = !sub.notifyEnabled;
    if (next) {
      const permission = await requestNotificationPermission();
      if (permission !== "granted") return;
    }
    await syncSubscriptionReminders(sub.id, { notifyEnabled: next });
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        tabIndex={-1}
        aria-label={
          enabled
            ? "إعدادات تذكير الاشتراك"
            : "تفعيل تذكير الاشتراك"
        }
        aria-expanded={open}
        className={cn(
          "rounded p-1.5 transition group-hover:opacity-100 focus:opacity-100",
          enabled
            ? "text-[var(--accent)] opacity-100"
            : "text-[var(--muted)] opacity-0 hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]",
        )}
        onClick={() => setOpen((value) => !value)}
      >
        {enabled ? (
          <Bell className="h-4 w-4" />
        ) : (
          <BellOff className="h-4 w-4" />
        )}
      </button>

      {open && (
        <div className="absolute end-0 top-full z-50 mt-1 w-56 rounded-xl border border-[var(--border)] bg-white p-3 text-xs shadow-lg">
          <p className="mb-2 font-medium text-[var(--foreground)]">
            تذكير التجديد
          </p>

          <label className="mb-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={() => void toggleNotifications()}
            />
            <span>تفعيل الإشعارات</span>
          </label>

          {subscription && (
            <>
              <label className="mb-2 block">
                <span className="mb-1 block text-[var(--muted)]">
                  قبل التجديد بـ
                </span>
                <select
                  className="w-full rounded-md border border-[var(--border)] px-2 py-1.5"
                  value={subscription.notifyDaysBefore}
                  onChange={(event) =>
                    void syncSubscriptionReminders(subscription.id, {
                      notifyDaysBefore: Number(event.target.value),
                      notifyEnabled: true,
                    })
                  }
                >
                  <option value={0}>نفس اليوم</option>
                  <option value={1}>يوم واحد</option>
                  <option value={3}>3 أيام</option>
                  <option value={7}>أسبوع</option>
                </select>
              </label>

              <label className="mb-2 block">
                <span className="mb-1 block text-[var(--muted)]">وقت التذكير</span>
                <input
                  type="time"
                  className="w-full rounded-md border border-[var(--border)] px-2 py-1.5"
                  value={subscription.notifyTime}
                  onChange={(event) =>
                    void syncSubscriptionReminders(subscription.id, {
                      notifyTime: event.target.value,
                      notifyEnabled: true,
                    })
                  }
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[var(--muted)]">
                  يوم التجديد الشهري
                </span>
                <input
                  type="number"
                  min={1}
                  max={28}
                  className="w-full rounded-md border border-[var(--border)] px-2 py-1.5"
                  value={subscription.renewalDay}
                  onChange={(event) =>
                    void updateSubscription(subscription.id, {
                      renewalDay: Number(event.target.value),
                    })
                  }
                />
              </label>
            </>
          )}

          {!subscription && (
            <button
              type="button"
              className="mt-1 w-full rounded-md bg-[var(--accent-soft)] px-2 py-1.5 text-[var(--accent)]"
              onClick={() => void ensureSubscription().then(() => setOpen(true))}
            >
              إنشاء اشتراك مرتبط
            </button>
          )}
        </div>
      )}
    </div>
  );
}
