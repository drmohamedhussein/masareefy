"use client";

import { Plus, Search } from "lucide-react";
import { formatMoney, totalForExpenses } from "@/core";
import { withSequentialNumbers } from "@/core/expense-filters";
import type { CurrencyCode } from "@/core/types";
import { useExpenses } from "@/components/expenses/expenses-provider";
import { ExpensesTable } from "@/components/expenses/expenses-table";
import { useCallback, useState } from "react";

function toDateInputValue(iso: string): string {
  return iso;
}

export function ExpensesView({ compact = false }: { compact?: boolean }) {
  const {
    visibleExpenses,
    profile,
    loading,
    selectedDate,
    search,
    sortKey,
    sortDirection,
    pendingUndo,
    setSelectedDate,
    setSearch,
    setSort,
    addExpense,
    updateExpense,
    deleteExpense,
    undoDelete,
    dismissUndo,
  } = useExpenses();

  const [focusNewRowId, setFocusNewRowId] = useState<string | null>(null);
  const currency = (profile?.currency ?? "EGP") as CurrencyCode;
  const currencyLabel = currency === "EGP" ? "ج.م" : currency;
  const totals = totalForExpenses(visibleExpenses);
  const rows = withSequentialNumbers(visibleExpenses);

  const handleAdd = useCallback(async () => {
    const created = await addExpense({
      amount: null,
      itemName: "",
      notes: "",
      spentOn: selectedDate,
    });
    setFocusNewRowId(created.id);
  }, [addExpense, selectedDate]);

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-white p-8 text-sm text-[var(--muted-foreground)]">
        جاري تحميل مصروفاتك…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!compact && (
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">المصروفات</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            سجّل مشترياتك بسرعة — مثل جدول Notion
          </p>
        </header>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm shadow-[var(--shadow-sm)]">
            <span className="text-[var(--muted)]">التاريخ</span>
            <input
              type="date"
              value={toDateInputValue(selectedDate)}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="bg-transparent outline-none"
            />
          </label>

          <label className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="بحث بالاسم أو الملاحظات"
              className="w-full rounded-lg border border-[var(--border)] bg-white py-2 pe-3 ps-9 text-sm shadow-[var(--shadow-sm)] outline-none focus:border-[var(--accent)]"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => void handleAdd()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-sm)] hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          إضافة مصروف
        </button>
      </div>

      <ExpensesTable
        rows={rows}
        currencyLabel={currencyLabel}
        focusNewRowId={focusNewRowId}
        onClearFocusNewRow={() => setFocusNewRowId(null)}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortAmount={() => setSort("amount")}
        onSortName={() => setSort("itemName")}
        onUpdate={async (id, patch) => {
          await updateExpense(id, patch);
        }}
        onDelete={async (id) => {
          await deleteExpense(id);
        }}
        onRequestAdd={handleAdd}
      />

      <footer className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm shadow-[var(--shadow-sm)]">
        <p className="text-[var(--muted-foreground)]">
          عدد المشتريات:{" "}
          <span className="font-semibold text-[var(--foreground)]">
            {totals.count}
          </span>
        </p>
        <p className="text-[var(--muted-foreground)]">
          الإجمالي:{" "}
          <span className="font-semibold text-[var(--foreground)]">
            {formatMoney(totals.total, currency)}
          </span>
        </p>
      </footer>

      {pendingUndo && (
        <div className="fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-lg items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--foreground)] px-4 py-3 text-sm text-white shadow-lg md:bottom-6">
          <span>تم حذف «{pendingUndo.expense.itemName}»</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md bg-white/15 px-3 py-1.5 hover:bg-white/25"
              onClick={() => void undoDelete()}
            >
              تراجع
            </button>
            <button
              type="button"
              className="rounded-md px-2 py-1.5 text-white/70 hover:text-white"
              onClick={dismissUndo}
              aria-label="إغلاق"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Mobile FAB */}
      <button
        type="button"
        onClick={() => void handleAdd()}
        className="fixed bottom-20 end-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg md:hidden"
        aria-label="إضافة مصروف"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
