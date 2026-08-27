"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { DEFAULT_TAGS, type RecurringExpense } from "@/core/types";
import { normalizeTags } from "@/core/export";
import { createRecurringId } from "@/lib/storage/local-repository";
import { getExpenseRepository } from "@/lib/storage/get-repository";

export function RecurringPanel() {
  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const repo = getExpenseRepository();
    const list = (await repo.listRecurring?.()) ?? [];
    setItems(list);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const persist = async (next: RecurringExpense[]) => {
    setSaving(true);
    setMessage(null);
    try {
      const repo = getExpenseRepository();
      await repo.saveRecurring?.(next);
      setItems(next);
      setMessage("تم الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const updateItem = (id: string, patch: Partial<RecurringExpense>) => {
    const next = items.map((item) =>
      item.id === id ? { ...item, ...patch } : item,
    );
    setItems(next);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-medium">مصروفات متكررة</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              إيجار، إنترنت، اشتراكات — تُضاف تلقائيًا في يوم الشهر المحدد
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--hover)]"
            onClick={() => {
              const next: RecurringExpense[] = [
                ...items,
                {
                  id: createRecurringId(),
                  title: "",
                  amount: null,
                  tags: ["اشتراكات"],
                  dayOfMonth: 1,
                  active: true,
                  notes: null,
                },
              ];
              setItems(next);
            }}
          >
            <Plus className="h-4 w-4" />
            إضافة
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            لا توجد مصروفات متكررة بعد.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="grid gap-2 rounded-lg border border-[var(--border)] p-3 sm:grid-cols-[1fr_100px_90px_120px_auto]"
              >
                <input
                  value={item.title}
                  placeholder="الاسم (إيجار…)"
                  className="rounded-md border border-[var(--border)] px-2 py-1.5 text-sm"
                  onChange={(e) => updateItem(item.id, { title: e.target.value })}
                />
                <input
                  type="number"
                  min={0}
                  value={item.amount ?? ""}
                  placeholder="السعر"
                  className="rounded-md border border-[var(--border)] px-2 py-1.5 text-sm"
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    updateItem(item.id, {
                      amount: raw ? Number(raw) : null,
                    });
                  }}
                />
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={item.dayOfMonth}
                  title="يوم الشهر"
                  className="rounded-md border border-[var(--border)] px-2 py-1.5 text-sm"
                  onChange={(e) =>
                    updateItem(item.id, {
                      dayOfMonth: Math.min(
                        28,
                        Math.max(1, Number(e.target.value) || 1),
                      ),
                    })
                  }
                />
                <select
                  value={item.tags[0] ?? "اشتراكات"}
                  className="rounded-md border border-[var(--border)] px-2 py-1.5 text-sm"
                  onChange={(e) =>
                    updateItem(item.id, {
                      tags: normalizeTags([e.target.value]),
                    })
                  }
                >
                  {DEFAULT_TAGS.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                    <input
                      type="checkbox"
                      checked={item.active}
                      onChange={(e) =>
                        updateItem(item.id, { active: e.target.checked })
                      }
                    />
                    نشط
                  </label>
                  <button
                    type="button"
                    aria-label="حذف"
                    className="rounded p-1.5 text-[var(--muted)] hover:bg-red-50 hover:text-[var(--danger)]"
                    onClick={() => {
                      void persist(items.filter((x) => x.id !== item.id));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            disabled={saving}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white disabled:opacity-60"
            onClick={() => void persist(items)}
          >
            {saving ? "جارٍ الحفظ…" : "حفظ المتكررة"}
          </button>
          {message && (
            <span className="text-sm text-[var(--success)]">{message}</span>
          )}
        </div>
      </section>
    </div>
  );
}
