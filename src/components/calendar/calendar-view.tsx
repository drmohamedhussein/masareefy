"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  buildMonthGrid,
  monthLabelAr,
} from "@/core/calendar";
import { formatMoney, todayISO, parseISODate } from "@/core";
import type { CurrencyCode } from "@/core/types";
import { useExpenses } from "@/components/expenses/expenses-provider";
import { useClientMounted } from "@/lib/hooks/use-client-mounted";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

export function CalendarView() {
  const router = useRouter();
  const {
    expenses,
    profile,
    selectedDate,
    setSelectedDate,
    addExpense,
    loading,
  } = useExpenses();

  const initial = selectedDate || todayISO();
  const initialDate = parseISODate(initial);
  const [cursor, setCursor] = useState({
    year: initialDate.getFullYear(),
    monthIndex: initialDate.getMonth(),
  });

  const currency = (profile?.currency ?? "EGP") as CurrencyCode;
  const today = todayISO();

  const cells = useMemo(
    () => buildMonthGrid(cursor.year, cursor.monthIndex, expenses, today),
    [cursor.year, cursor.monthIndex, expenses, today],
  );

  const monthTotal = useMemo(() => {
    return cells
      .filter((cell) => cell.inCurrentMonth)
      .reduce(
        (acc, cell) => ({
          count: acc.count + cell.count,
          total: acc.total + cell.total,
        }),
        { count: 0, total: 0 },
      );
  }, [cells]);

  const openDay = (date: string) => {
    setSelectedDate(date);
    router.push("/expenses");
  };

  const addForDay = async (date: string) => {
    setSelectedDate(date);
    await addExpense({
      amount: null,
      itemName: "",
      notes: "",
      spentOn: date,
    });
    router.push("/expenses");
  };

  const mounted = useClientMounted();

  if (!mounted || loading) {
    return (
      <div
        className="rounded-xl border border-[var(--border)] bg-white p-8 text-sm text-[var(--muted-foreground)]"
        suppressHydrationWarning
      >
        جاري تحميل التقويم…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">التقويم</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            اضغط على يوم لعرض مصروفاته أو أضف بسرعة
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm hover:bg-[var(--hover)]"
            onClick={() =>
              setCursor((current) => {
                const date = new Date(current.year, current.monthIndex - 1, 1);
                return {
                  year: date.getFullYear(),
                  monthIndex: date.getMonth(),
                };
              })
            }
            aria-label="الشهر السابق"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <p className="min-w-[140px] text-center text-sm font-medium">
            {monthLabelAr(cursor.year, cursor.monthIndex)}
          </p>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm hover:bg-[var(--hover)]"
            onClick={() =>
              setCursor((current) => {
                const date = new Date(current.year, current.monthIndex + 1, 1);
                return {
                  year: date.getFullYear(),
                  monthIndex: date.getMonth(),
                };
              })
            }
            aria-label="الشهر التالي"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm hover:bg-[var(--hover)]"
            onClick={() => {
              const now = new Date();
              setCursor({ year: now.getFullYear(), monthIndex: now.getMonth() });
              setSelectedDate(today);
            }}
          >
            اليوم
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-4 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm shadow-[var(--shadow-sm)]">
        <p className="text-[var(--muted-foreground)]">
          مشتريات الشهر:{" "}
          <span className="font-semibold text-[var(--foreground)]">
            {monthTotal.count}
          </span>
        </p>
        <p className="text-[var(--muted-foreground)]">
          إجمالي الشهر:{" "}
          <span className="font-semibold text-[var(--foreground)]">
            {formatMoney(monthTotal.total, currency)}
          </span>
        </p>
        <Link
          href="/expenses"
          className="ms-auto text-[var(--accent)] hover:underline"
        >
          فتح جدول المصروفات
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
        <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--surface)] text-center text-xs text-[var(--muted-foreground)]">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-1 py-2 font-medium">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell) => {
            const selected = cell.date === selectedDate;
            const hasData = cell.count > 0;
            return (
              <div
                key={cell.date}
                className={cn(
                  "min-h-[92px] border-b border-e border-[var(--border)] p-1.5 sm:min-h-[110px] sm:p-2",
                  !cell.inCurrentMonth && "bg-[var(--surface)]/60",
                  selected && "bg-[var(--accent-soft)]",
                )}
              >
                <button
                  type="button"
                  onClick={() => openDay(cell.date)}
                  className="flex h-full w-full flex-col items-stretch gap-1 rounded-md p-1 text-start hover:bg-[var(--hover)]"
                >
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                      cell.isToday && "bg-[var(--accent)] font-semibold text-white",
                      !cell.inCurrentMonth && "text-[var(--muted)]",
                    )}
                  >
                    {Number(cell.date.slice(-2))}
                  </span>
                  {hasData ? (
                    <div className="mt-auto space-y-0.5">
                      <p className="text-[10px] text-[var(--muted-foreground)] sm:text-xs">
                        {cell.count} مشتريات
                      </p>
                      <p className="text-[10px] font-medium text-[var(--foreground)] sm:text-xs">
                        {formatMoney(cell.total, currency, { compact: true })}
                      </p>
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                    </div>
                  ) : (
                    <span className="mt-auto text-[10px] text-transparent">.</span>
                  )}
                </button>
                <button
                  type="button"
                  aria-label={`إضافة مصروف في ${cell.date}`}
                  className="mt-1 hidden w-full items-center justify-center gap-1 rounded-md border border-dashed border-[var(--border)] py-1 text-[10px] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] sm:flex"
                  onClick={() => void addForDay(cell.date)}
                >
                  <Plus className="h-3 w-3" />
                  إضافة
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
