"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import type { CurrencyCode, Expense } from "@/core/types";
import { currencySymbol } from "@/core/money";
import { DEFAULT_TAGS } from "@/core/types";
import { parseAmountInput, isBlankAmountInput } from "@/core/money";
import { normalizeTags } from "@/core/export";
import { SubscriptionReminderButton } from "@/components/expenses/subscription-reminder-button";
import { useI18n } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

type FocusField = "amount" | "itemName" | "tags" | "notes";

const FIELD_ORDER: FocusField[] = ["amount", "itemName", "tags", "notes"];

interface ExpensesTableProps {
  rows: Array<Expense & { rowNumber: number }>;
  enabledCurrencies: CurrencyCode[];
  focusNewRowId?: string | null;
  onClearFocusNewRow?: () => void;
  onUpdate: (
    id: string,
    patch: Partial<
      Pick<Expense, "amount" | "itemName" | "tags" | "notes" | "currency">
    >,
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRequestAdd: () => Promise<void>;
  onSortAmount: () => void;
  onSortName: () => void;
  onSortTags: () => void;
  sortKey: string;
  sortDirection: string;
}

function cellSelector(rowId: string, field: FocusField): string {
  return `[data-masareefy-cell="${rowId}:${field}"]`;
}

function focusCell(rowId: string, field: FocusField): void {
  const el = document.querySelector<HTMLInputElement>(cellSelector(rowId, field));
  if (!el) return;
  el.focus();
  el.select();
}

function CellInput({
  rowId,
  field,
  value,
  onCommit,
  onMove,
  placeholder,
  className,
  autoFocus,
  inputMode,
  ariaLabel,
  listId,
}: {
  rowId: string;
  field: FocusField;
  value: string;
  onCommit: (next: string) => void;
  onMove: (direction: "next" | "prev" | "add") => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  ariaLabel: string;
  listId?: string;
}) {
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  const focusedRef = useRef(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    if (!focusedRef.current) setDraft(value);
  }, [value]);

  useEffect(() => {
    if (!autoFocus) return;
    const frame = requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.select();
    });
    return () => cancelAnimationFrame(frame);
  }, [autoFocus]);

  const commitIfNeeded = () => {
    const next = draftRef.current;
    if (next !== value) onCommit(next);
  };

  return (
    <input
      ref={ref}
      data-masareefy-cell={`${rowId}:${field}`}
      aria-label={ariaLabel}
      list={listId}
      inputMode={inputMode}
      value={draft}
      placeholder={placeholder}
      className={cn(
        "w-full bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[var(--muted)] focus:bg-[var(--accent-soft)]",
        className,
      )}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onBlur={() => {
        focusedRef.current = false;
        commitIfNeeded();
      }}
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          commitIfNeeded();
          onMove(event.shiftKey ? "prev" : "next");
          return;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          commitIfNeeded();
          onMove(field === "notes" ? "add" : "next");
        }
      }}
    />
  );
}

export function ExpensesTable({
  rows,
  enabledCurrencies,
  focusNewRowId,
  onClearFocusNewRow,
  onUpdate,
  onDelete,
  onRequestAdd,
  onSortAmount,
  onSortName,
  onSortTags,
  sortKey,
  sortDirection,
}: ExpensesTableProps) {
  const { t } = useI18n();
  const [focusTarget, setFocusTarget] = useState<{
    id: string;
    field: FocusField;
  } | null>(null);
  const rowIds = rows.map((row) => row.id);

  useEffect(() => {
    if (!focusNewRowId) return;
    setFocusTarget({ id: focusNewRowId, field: "amount" });
    onClearFocusNewRow?.();
  }, [focusNewRowId, onClearFocusNewRow]);

  useEffect(() => {
    if (!focusTarget) return;
    const frame = requestAnimationFrame(() => {
      focusCell(focusTarget.id, focusTarget.field);
    });
    return () => cancelAnimationFrame(frame);
  }, [focusTarget, rows]);

  const moveFrom = (
    rowId: string,
    field: FocusField,
    direction: "next" | "prev" | "add",
  ) => {
    if (direction === "add") {
      void onRequestAdd();
      return;
    }

    const fieldIndex = FIELD_ORDER.indexOf(field);
    const rowIndex = rowIds.indexOf(rowId);

    if (direction === "next") {
      if (fieldIndex < FIELD_ORDER.length - 1) {
        const nextField = FIELD_ORDER[fieldIndex + 1]!;
        setFocusTarget({ id: rowId, field: nextField });
        focusCell(rowId, nextField);
        return;
      }
      if (rowIndex >= 0 && rowIndex < rowIds.length - 1) {
        const nextRowId = rowIds[rowIndex + 1]!;
        setFocusTarget({ id: nextRowId, field: "amount" });
        focusCell(nextRowId, "amount");
        return;
      }
      void onRequestAdd();
      return;
    }

    if (fieldIndex > 0) {
      const prevField = FIELD_ORDER[fieldIndex - 1]!;
      setFocusTarget({ id: rowId, field: prevField });
      focusCell(rowId, prevField);
      return;
    }
    if (rowIndex > 0) {
      const prevRowId = rowIds[rowIndex - 1]!;
      setFocusTarget({ id: prevRowId, field: "notes" });
      focusCell(prevRowId, "notes");
    }
  };

  const sortMark = (key: string) =>
    sortKey === key ? (sortDirection === "asc" ? " ↑" : " ↓") : "";

  const cycleCurrency = (current: CurrencyCode): CurrencyCode => {
    const list = enabledCurrencies.length > 0 ? enabledCurrencies : [current];
    const index = list.indexOf(current);
    return list[(index + 1) % list.length] ?? current;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
      <datalist id="masareefy-tags">
        {DEFAULT_TAGS.map((tag) => (
          <option key={tag} value={tag} />
        ))}
      </datalist>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)]">
              <th className="w-14 px-3 py-2.5 text-start font-medium">#</th>
              <th className="w-32 px-1 py-2.5 text-start font-medium">
                <button type="button" tabIndex={-1} className="rounded px-2 py-1 hover:bg-[var(--hover)]" onClick={onSortAmount}>
                  {t.table.price}{sortMark("amount")}
                </button>
              </th>
              <th className="min-w-[160px] px-1 py-2.5 text-start font-medium">
                <button type="button" tabIndex={-1} className="rounded px-2 py-1 hover:bg-[var(--hover)]" onClick={onSortName}>
                  {t.table.itemName}{sortMark("itemName")}
                </button>
              </th>
              <th className="min-w-[140px] px-1 py-2.5 text-start font-medium">
                <button type="button" tabIndex={-1} className="rounded px-2 py-1 hover:bg-[var(--hover)]" onClick={onSortTags}>
                  {t.table.category}{sortMark("tags")}
                </button>
              </th>
              <th className="min-w-[160px] px-3 py-2.5 text-start font-medium">{t.table.notes}</th>
              <th className="w-20 px-2 py-2.5" aria-label={t.table.actions} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[var(--muted-foreground)]">
                  {t.expenses.empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="group border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface)]">
                  <td className="px-3 py-1 text-[var(--muted)] tabular-nums">{row.rowNumber}</td>
                  <td className="px-0 py-0">
                    <div className="flex items-center gap-1">
                      <CellInput
                        rowId={row.id}
                        field="amount"
                        ariaLabel={`${t.table.price} ${row.itemName || t.expenses.title}`}
                        value={row.amount == null ? "" : String(row.amount)}
                        inputMode="decimal"
                        autoFocus={focusTarget?.id === row.id && focusTarget.field === "amount"}
                        className="text-start font-medium tabular-nums"
                        onCommit={(raw) => {
                          if (isBlankAmountInput(raw)) {
                            void onUpdate(row.id, { amount: null });
                            return;
                          }
                          const parsed = parseAmountInput(raw);
                          if (parsed == null) return;
                          void onUpdate(row.id, { amount: parsed });
                        }}
                        onMove={(direction) => moveFrom(row.id, "amount", direction)}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        title={t.table.changeCurrency}
                        className="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)]"
                        onClick={() => {
                          const next = cycleCurrency(row.currency);
                          if (next !== row.currency) {
                            void onUpdate(row.id, { currency: next });
                          }
                        }}
                      >
                        {currencySymbol(row.currency)}
                      </button>
                    </div>
                  </td>
                  <td className="px-0 py-0">
                    <CellInput
                      rowId={row.id}
                      field="itemName"
                      ariaLabel={t.table.itemName}
                      value={row.itemName}
                      placeholder={t.table.itemPlaceholder}
                      autoFocus={focusTarget?.id === row.id && focusTarget.field === "itemName"}
                      onCommit={(next) => void onUpdate(row.id, { itemName: next })}
                      onMove={(direction) => moveFrom(row.id, "itemName", direction)}
                    />
                  </td>
                  <td className="px-0 py-0">
                    <CellInput
                      rowId={row.id}
                      field="tags"
                      ariaLabel={t.table.category}
                      value={(row.tags ?? []).join(", ")}
                      placeholder={t.table.tagPlaceholder}
                      listId="masareefy-tags"
                      autoFocus={focusTarget?.id === row.id && focusTarget.field === "tags"}
                      onCommit={(next) =>
                        void onUpdate(row.id, { tags: normalizeTags(next) })
                      }
                      onMove={(direction) => moveFrom(row.id, "tags", direction)}
                    />
                  </td>
                  <td className="px-0 py-0">
                    <CellInput
                      rowId={row.id}
                      field="notes"
                      ariaLabel={t.table.notes}
                      value={row.notes ?? ""}
                      placeholder={t.table.notesOptional}
                      autoFocus={focusTarget?.id === row.id && focusTarget.field === "notes"}
                      onCommit={(next) => void onUpdate(row.id, { notes: next })}
                      onMove={(direction) => moveFrom(row.id, "notes", direction)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <div className="flex items-center justify-end gap-0.5">
                      <SubscriptionReminderButton expense={row} />
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label={t.table.deleteExpense}
                        className="rounded p-1.5 text-[var(--muted)] opacity-0 transition hover:bg-red-50 hover:text-[var(--danger)] group-hover:opacity-100 focus:opacity-100"
                        onClick={() => void onDelete(row.id)}
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
