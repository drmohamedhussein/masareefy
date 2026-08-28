"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatMoney,
  resolveDateRange,
  summarizeAnalytics,
  todayISO,
  colorForTag,
} from "@/core";
import type { CurrencyCode, DatePreset } from "@/core/types";
import { useExpenses } from "@/components/expenses/expenses-provider";
import { useI18n } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

export function AnalyticsView() {
  const { t } = useI18n();
  const { expenses, profile, loading } = useExpenses();
  const [preset, setPreset] = useState<DatePreset>("this_month");
  const [customFrom, setCustomFrom] = useState(todayISO());
  const [customTo, setCustomTo] = useState(todayISO());

  const currency = (profile?.currency ?? "EGP") as CurrencyCode;

  const range = useMemo(
    () =>
      resolveDateRange(preset, {
        from: customFrom,
        to: customTo,
      }),
    [preset, customFrom, customTo],
  );

  const PRESETS: Array<{ id: DatePreset; label: string }> = [
    { id: "today", label: t.analytics.presets.today },
    { id: "this_week", label: t.analytics.presets.this_week },
    { id: "this_month", label: t.analytics.presets.this_month },
    { id: "last_month", label: t.analytics.presets.last_month },
    { id: "custom", label: t.analytics.presets.custom },
  ];

  const summary = useMemo(
    () => summarizeAnalytics(expenses, range, currency),
    [expenses, range, currency],
  );

  const chartData = useMemo(
    () =>
      summary.dailySpending.map((day) => ({
        date: day.date.slice(5),
        fullDate: day.date,
        total: day.total,
        count: day.count,
      })),
    [summary.dailySpending],
  );

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-white p-8 text-sm text-[var(--muted-foreground)]">
        {t.analytics.loading}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t.analytics.title}</h1>
        <p className="text-sm text-[var(--muted-foreground)]">{t.analytics.subtitle}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPreset(item.id)}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm transition",
              preset === item.id
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:bg-[var(--hover)]",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {preset === "custom" && (
        <div className="flex flex-wrap gap-3 rounded-xl border border-[var(--border)] bg-white p-3 text-sm shadow-[var(--shadow-sm)]">
          <label className="flex items-center gap-2">
            <span className="text-[var(--muted)]">من</span>
            <input
              type="date"
              value={customFrom}
              onChange={(event) => setCustomFrom(event.target.value)}
              className="rounded-md border border-[var(--border)] px-2 py-1.5"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-[var(--muted)]">إلى</span>
            <input
              type="date"
              value={customTo}
              onChange={(event) => setCustomTo(event.target.value)}
              className="rounded-md border border-[var(--border)] px-2 py-1.5"
            />
          </label>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="إجمالي المصروف"
          value={formatMoney(summary.totalSpent, currency)}
        />
        <StatCard
          label="عدد المشتريات"
          value={String(summary.purchaseCount)}
        />
        <StatCard
          label="متوسط يومي"
          value={formatMoney(summary.dailyAverage, currency)}
        />
        <StatCard
          label="أعلى يوم إنفاق"
          value={
            summary.highestSpendingDay
              ? `${summary.highestSpendingDay.date} · ${formatMoney(summary.highestSpendingDay.total, currency)}`
              : "—"
          }
        />
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
        <h2 className="mb-3 text-sm font-medium">المبلغ المصروف يوميًا</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={40} />
              <Tooltip
                formatter={(value) => formatMoney(Number(value ?? 0), currency)}
                labelFormatter={(_, payload) =>
                  String(payload?.[0]?.payload?.fullDate ?? "")
                }
              />
              <Bar dataKey="total" fill="#2f6fed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
        <h2 className="mb-3 text-sm font-medium">عدد المشتريات يوميًا</h2>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
              <Tooltip
                formatter={(value) => [`${value}`, "مشتريات"]}
                labelFormatter={(_, payload) =>
                  String(payload?.[0]?.payload?.fullDate ?? "")
                }
              />
              <Bar dataKey="count" fill="#5f5f5a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
        <h2 className="mb-3 text-sm font-medium">حسب التصنيف (الوسوم)</h2>
        {summary.byTag.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">لا بيانات.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)] text-sm">
            {summary.byTag.map((row) => (
              <li key={row.tag} className="flex items-center justify-between py-2">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: colorForTag(row.tag) }}
                    aria-hidden
                  />
                  {row.tag} · {row.count}
                </span>
                <span className="font-semibold tabular-nums">
                  {formatMoney(row.total, currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
        <h2 className="mb-3 text-sm font-medium">أعلى المشتريات سعرًا</h2>
        {summary.topExpenses.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            لا توجد مشتريات مسعّرة في هذه الفترة.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)] text-sm">
            {summary.topExpenses.map((expense, index) => (
              <li
                key={expense.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {index + 1}. {expense.itemName || "بدون اسم"}
                  </p>
                  <p className="text-xs text-[var(--muted)]">{expense.spentOn}</p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">
                  {formatMoney(expense.amount ?? 0, currency)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
      <p className="mb-1 text-xs text-[var(--muted)]">{label}</p>
      <p className="text-base font-semibold leading-relaxed">{value}</p>
    </div>
  );
}
