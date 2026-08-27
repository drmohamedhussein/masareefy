"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import type {
  CurrencyCode,
  Expense,
  ExpenseDraft,
  ExpenseQuery,
  ExpenseSortKey,
  Profile,
  SortDirection,
} from "@/core/types";
import { filterExpenses } from "@/core/expense-filters";
import { todayISO } from "@/core/date-range";
import { getExpenseRepository } from "@/lib/storage/get-repository";
import { syncExpensesEverywhere } from "@/lib/sync/everywhere";
import { normalizeTags } from "@/core/export";

interface PendingUndo {
  expense: Expense;
  timeoutId: ReturnType<typeof setTimeout>;
}

interface ExpensesContextValue {
  expenses: Expense[];
  visibleExpenses: Expense[];
  profile: Profile | null;
  loading: boolean;
  selectedDate: string;
  search: string;
  tagFilter: string;
  sortKey: ExpenseSortKey;
  sortDirection: SortDirection;
  pendingUndo: PendingUndo | null;
  setSelectedDate: (date: string) => void;
  setSearch: (value: string) => void;
  setTagFilter: (value: string) => void;
  setSort: (key: ExpenseSortKey) => void;
  refresh: () => Promise<void>;
  addExpense: (draft?: Partial<ExpenseDraft>) => Promise<Expense>;
  updateExpense: (id: string, patch: Partial<ExpenseDraft>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  undoDelete: () => Promise<void>;
  dismissUndo: () => void;
  updateCurrency: (currency: CurrencyCode) => Promise<void>;
}

const ExpensesContext = createContext<ExpensesContextValue | null>(null);

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const repo = useMemo(() => getExpenseRepository(), []);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sortKey, setSortKey] = useState<ExpenseSortKey>("spentOn");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [pendingUndo, setPendingUndo] = useState<PendingUndo | null>(null);
  const [, startTransition] = useTransition();
  const undoRef = useRef<PendingUndo | null>(null);
  const sortRef = useRef({ key: sortKey, direction: sortDirection });

  useEffect(() => {
    sortRef.current = { key: sortKey, direction: sortDirection };
  }, [sortKey, sortDirection]);

  const refresh = useCallback(async () => {
    const [rows, nextProfile] = await Promise.all([
      repo.listExpenses(),
      repo.getProfile(),
    ]);
    startTransition(() => {
      setExpenses(rows);
      setProfile(nextProfile);
      setLoading(false);
    });
  }, [repo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    undoRef.current = pendingUndo;
  }, [pendingUndo]);

  useEffect(() => {
    return () => {
      if (undoRef.current?.timeoutId) {
        clearTimeout(undoRef.current.timeoutId);
      }
    };
  }, []);

  const query: ExpenseQuery = useMemo(
    () => ({
      spentOn: selectedDate,
      search,
      tag: tagFilter || undefined,
      sortKey,
      sortDirection,
    }),
    [selectedDate, search, tagFilter, sortKey, sortDirection],
  );

  const visibleExpenses = useMemo(
    () => filterExpenses(expenses, query),
    [expenses, query],
  );

  const setSort = useCallback((key: ExpenseSortKey) => {
    const current = sortRef.current;
    if (current.key === key) {
      const nextDirection: SortDirection =
        current.direction === "asc" ? "desc" : "asc";
      sortRef.current = { key, direction: nextDirection };
      setSortDirection(nextDirection);
      return;
    }

    const nextDirection: SortDirection = key === "itemName" ? "asc" : "desc";
    sortRef.current = { key, direction: nextDirection };
    setSortKey(key);
    setSortDirection(nextDirection);
  }, []);

  const syncQuietly = useCallback(async () => {
    try {
      const rows = await repo.listExpenses();
      await syncExpensesEverywhere(rows);
    } catch {
      // الربط اختياري
    }
  }, [repo]);

  const addExpense = useCallback(
    async (draft: Partial<ExpenseDraft> = {}) => {
      const created = await repo.createExpense({
        amount:
          draft.amount !== undefined
            ? draft.amount != null && draft.amount > 0
              ? draft.amount
              : null
            : null,
        itemName: draft.itemName ?? "",
        tags: normalizeTags(draft.tags),
        notes: draft.notes ?? "",
        spentOn: draft.spentOn || selectedDate,
      });
      await refresh();
      void syncQuietly();
      return created;
    },
    [repo, refresh, selectedDate, syncQuietly],
  );

  const updateExpense = useCallback(
    async (id: string, patch: Partial<ExpenseDraft>) => {
      setExpenses((current) =>
        current.map((item) => {
          if (item.id !== id) return item;
          return {
            ...item,
            amount:
              patch.amount !== undefined
                ? patch.amount != null && patch.amount > 0
                  ? patch.amount
                  : null
                : item.amount,
            itemName:
              patch.itemName !== undefined ? patch.itemName : item.itemName,
            tags:
              patch.tags !== undefined ? normalizeTags(patch.tags) : item.tags,
            notes:
              patch.notes !== undefined
                ? patch.notes?.trim()
                  ? patch.notes.trim()
                  : null
                : item.notes,
            spentOn: patch.spentOn ?? item.spentOn,
            updatedAt: new Date().toISOString(),
          };
        }),
      );
      await repo.updateExpense(id, patch);
      void syncQuietly();
    },
    [repo, syncQuietly],
  );

  const dismissUndo = useCallback(() => {
    setPendingUndo((current) => {
      if (current?.timeoutId) clearTimeout(current.timeoutId);
      return null;
    });
  }, []);

  const deleteExpense = useCallback(
    async (id: string) => {
      const target = expenses.find((item) => item.id === id);
      if (!target) return;

      if (undoRef.current?.timeoutId) {
        clearTimeout(undoRef.current.timeoutId);
      }

      await repo.deleteExpense(id);
      await refresh();
      void syncQuietly();

      const timeoutId = setTimeout(() => {
        setPendingUndo(null);
      }, 5000);

      setPendingUndo({ expense: target, timeoutId });
    },
    [expenses, repo, refresh, syncQuietly],
  );

  const undoDelete = useCallback(async () => {
    const pending = undoRef.current;
    if (!pending) return;
    clearTimeout(pending.timeoutId);
    await repo.createExpense({
      amount: pending.expense.amount,
      itemName: pending.expense.itemName,
      tags: pending.expense.tags,
      notes: pending.expense.notes,
      spentOn: pending.expense.spentOn,
    });
    setPendingUndo(null);
    await refresh();
    void syncQuietly();
  }, [repo, refresh, syncQuietly]);

  const updateCurrency = useCallback(
    async (currency: CurrencyCode) => {
      await repo.updateProfile({ currency });
      await refresh();
    },
    [repo, refresh],
  );

  const value = useMemo<ExpensesContextValue>(
    () => ({
      expenses,
      visibleExpenses,
      profile,
      loading,
      selectedDate,
      search,
      tagFilter,
      sortKey,
      sortDirection,
      pendingUndo,
      setSelectedDate,
      setSearch,
      setTagFilter,
      setSort,
      refresh,
      addExpense,
      updateExpense,
      deleteExpense,
      undoDelete,
      dismissUndo,
      updateCurrency,
    }),
    [
      expenses,
      visibleExpenses,
      profile,
      loading,
      selectedDate,
      search,
      tagFilter,
      sortKey,
      sortDirection,
      pendingUndo,
      setSort,
      refresh,
      addExpense,
      updateExpense,
      deleteExpense,
      undoDelete,
      dismissUndo,
      updateCurrency,
    ],
  );

  return (
    <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>
  );
}

export function useExpenses(): ExpensesContextValue {
  const ctx = useContext(ExpensesContext);
  if (!ctx) {
    throw new Error("useExpenses يجب استخدامه داخل ExpensesProvider");
  }
  return ctx;
}
