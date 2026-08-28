"use client";

import { useState } from "react";
import {
  Bell,
  Calendar,
  Plus,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { formatMoney } from "@/core/money";
import {
  advanceRenewalDate,
  sortSubscriptionsByRenewal,
} from "@/core/subscriptions";
import type { CurrencyCode, SubscriptionCycle } from "@/core/types";
import { useExpenses } from "@/components/expenses/expenses-provider";
import { useClientMounted } from "@/lib/hooks/use-client-mounted";
import { useI18n } from "@/components/providers/locale-provider";
import {
  requestNotificationPermission,
} from "@/lib/notifications/reminder-engine";
import { cn } from "@/lib/utils";

const CYCLE_KEYS = ["weekly", "monthly", "yearly"] as const;

export function SubscriptionsView() {
  const { t } = useI18n();
  const {
    subscriptions,
    profile,
    loading,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    syncSubscriptionReminders,
  } = useExpenses();
  const mounted = useClientMounted();
  const currency = (profile?.currency ?? "EGP") as CurrencyCode;
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [renewalDay, setRenewalDay] = useState("1");

  const sorted = sortSubscriptionsByRenewal(subscriptions);

  const handleAdd = async () => {
    if (!title.trim()) return;
    await addSubscription({
      title: title.trim(),
      amount: amount ? Number(amount) : null,
      renewalDay: Number(renewalDay) || 1,
      cycle: "monthly",
      notifyEnabled: false,
      notifyDaysBefore: 1,
      notifyTime: "09:00",
    });
    setTitle("");
    setAmount("");
  };

  if (!mounted || loading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-white p-8 text-sm text-[var(--muted-foreground)]">
        {t.subscriptions.loading}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.subscriptions.title}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{t.subscriptions.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <Calendar className="h-4 w-4" />
          <span>{sorted.filter((s) => s.active).length} اشتراك نشط</span>
        </div>
      </header>

      <section className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
        <h2 className="mb-3 text-sm font-medium">إضافة اشتراك جديد</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex-1 text-xs">
            <span className="mb-1 block text-[var(--muted)]">الاسم</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Netflix، Spotify…"
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            />
          </label>
          <label className="w-full sm:w-28 text-xs">
            <span className="mb-1 block text-[var(--muted)]">المبلغ</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0"
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            />
          </label>
          <label className="w-full sm:w-24 text-xs">
            <span className="mb-1 block text-[var(--muted)]">يوم التجديد</span>
            <input
              type="number"
              min={1}
              max={28}
              value={renewalDay}
              onChange={(e) => setRenewalDay(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => void handleAdd()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            إضافة
          </button>
        </div>
      </section>

      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)]">
              <th className="px-4 py-2.5 text-start font-medium">الاشتراك</th>
              <th className="px-2 py-2.5 text-start font-medium">المبلغ</th>
              <th className="px-2 py-2.5 text-start font-medium">الدورة</th>
              <th className="px-2 py-2.5 text-start font-medium">التجديد القادم</th>
              <th className="px-2 py-2.5 text-start font-medium">التذكير</th>
              <th className="w-20 px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-[var(--muted-foreground)]"
                >
                  لا توجد اشتراكات بعد. أضف واحداً هنا أو صنّف مصروفاً بوسم «اشتراكات».
                </td>
              </tr>
            ) : (
              sorted.map((sub) => (
                <tr
                  key={sub.id}
                  className="group border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface)]"
                >
                  <td className="px-4 py-2">
                    <input
                      value={sub.title}
                      onChange={(e) =>
                        void updateSubscription(sub.id, {
                          title: e.target.value,
                        })
                      }
                      className="w-full bg-transparent outline-none focus:bg-[var(--accent-soft)]"
                    />
                    {sub.expenseId && (
                      <span className="text-[10px] text-[var(--muted)]">
                        مرتبط بمصروف
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 tabular-nums">
                    {sub.amount != null
                      ? formatMoney(sub.amount, currency)
                      : "—"}
                  </td>
                  <td className="px-2 py-2">
                    <select
                      value={sub.cycle}
                      onChange={(e) =>
                        void updateSubscription(sub.id, {
                          cycle: e.target.value as SubscriptionCycle,
                        })
                      }
                      className="rounded border border-transparent bg-transparent px-1 py-0.5 text-sm hover:border-[var(--border)]"
                    >
                      {CYCLE_KEYS.map((key) => (
                        <option key={key} value={key}>
                          {t.subscriptions.cycles[key]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2 tabular-nums text-[var(--foreground)]">
                    {sub.nextRenewalDate}
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs",
                        sub.notifyEnabled
                          ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                          : "text-[var(--muted)] hover:bg-[var(--hover)]",
                      )}
                      onClick={async () => {
                        const next = !sub.notifyEnabled;
                        if (next) {
                          const p = await requestNotificationPermission();
                          if (p !== "granted") return;
                        }
                        await syncSubscriptionReminders(sub.id, {
                          notifyEnabled: next,
                        });
                      }}
                    >
                      <Bell className="h-3.5 w-3.5" />
                      {sub.notifyEnabled
                        ? sub.notifyDaysBefore === 0
                          ? "نفس اليوم"
                          : `قبل ${sub.notifyDaysBefore} ي`
                        : "إيقاف"}
                    </button>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        aria-label="تحديث تاريخ التجديد"
                        className="rounded p-1.5 text-[var(--muted)] opacity-0 transition hover:bg-[var(--hover)] group-hover:opacity-100"
                        onClick={() =>
                          void updateSubscription(sub.id, {
                            nextRenewalDate: advanceRenewalDate(
                              sub.nextRenewalDate,
                              sub.cycle,
                            ),
                          })
                        }
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="حذف الاشتراك"
                        className="rounded p-1.5 text-[var(--muted)] opacity-0 transition hover:bg-red-50 hover:text-[var(--danger)] group-hover:opacity-100"
                        onClick={() => void deleteSubscription(sub.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
