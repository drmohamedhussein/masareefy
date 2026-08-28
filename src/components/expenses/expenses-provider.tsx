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
  Subscription,
  SubscriptionDraft,
} from "@/core/types";
import { filterExpenses } from "@/core/expense-filters";
import { todayISO } from "@/core/date-range";
import { normalizeSpentOn } from "@/core/spent-on";
import { getExpenseRepository } from "@/lib/storage/get-repository";
import { syncExpensesEverywhere } from "@/lib/sync/everywhere";
import { normalizeTags } from "@/core/export";
import { draftsDueToday } from "@/core/recurring";
import {
  isSubscriptionExpense,
  subscriptionFromExpense,
} from "@/core/subscriptions";
import { initPreferencesBridge } from "@/lib/storage/preferences-bridge";
import {
  loadCalendarConnection,
  upsertCalendarReminderEvent,
} from "@/lib/google/calendar";

interface PendingUndo {
  expense: Expense;
  timeoutId: ReturnType<typeof setTimeout>;
}

interface ExpensesContextValue {
  expenses: Expense[];
  visibleExpenses: Expense[];
  subscriptions: Subscription[];
  profile: Profile | null;
  loading: boolean;
  selectedDate: string;
  search: string;
  tagFilter: string;
  sortKey: ExpenseSortKey;
  sortDirection: SortDirection;
  pendingUndo: PendingUndo | null;
  showAllDates: boolean;
  setSelectedDate: (date: string) => void;
  setShowAllDates: (value: boolean) => void;
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
  addSubscription: (draft: SubscriptionDraft) => Promise<Subscription>;
  updateSubscription: (
    id: string,
    patch: Partial<SubscriptionDraft>,
  ) => Promise<Subscription>;
  deleteSubscription: (id: string) => Promise<void>;
  getSubscriptionForExpense: (expenseId: string) => Subscription | null;
  syncSubscriptionReminders: (
    subscriptionId: string,
    patch: Partial<SubscriptionDraft>,
  ) => Promise<void>;
}

const ExpensesContext = createContext<ExpensesContextValue | null>(null);

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const repo = useMemo(() => getExpenseRepository(), []);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDateRaw] = useState(todayISO());
  const [showAllDates, setShowAllDates] = useState(false);
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
    const [rows, nextProfile, subs] = await Promise.all([
      repo.listExpenses(),
      repo.getProfile(),
      repo.listSubscriptions?.() ?? Promise.resolve([]),
    ]);
    startTransition(() => {
      setExpenses(rows);
      setSubscriptions(subs);
      setProfile(nextProfile);
      setLoading(false);
    });
  }, [repo]);

  const syncCalendarEvent = useCallback(async (sub: Subscription) => {
    const conn = loadCalendarConnection();
    if (!sub.notifyEnabled || !conn?.calendarAutoSync) return;
    if (!repo.updateSubscription) return;
    try {
      const eventId = await upsertCalendarReminderEvent({
        subscriptionId: sub.id,
        title: sub.title,
        renewalDate: sub.nextRenewalDate,
        notifyTime: sub.notifyTime,
        daysBefore: sub.notifyDaysBefore,
        amount: sub.amount,
        existingEventId: sub.googleCalendarEventId,
      });
      if (eventId !== sub.googleCalendarEventId) {
        await repo.updateSubscription(sub.id, {
          googleCalendarEventId: eventId,
        });
      }
    } catch {
      /* optional */
    }
  }, [repo]);

  useEffect(() => {
    void (async () => {
      await initPreferencesBridge();
      const recurring = (await repo.listRecurring?.()) ?? [];
      const rows = await repo.listExpenses();
      const due = draftsDueToday(recurring, rows);
      for (const draft of due) {
        await repo.createExpense(draft);
      }
      if (due.length > 0) {
        await syncExpensesEverywhere(await repo.listExpenses());
      }
      await refresh();
    })();
  }, [repo, refresh]);

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

  const setSelectedDate = useCallback((date: string) => {
    const normalized = normalizeSpentOn(date);
    if (normalized) setSelectedDateRaw(normalized);
  }, []);

  const query: ExpenseQuery = useMemo(
    () => ({
      spentOn: showAllDates ? undefined : selectedDate,
      search,
      tag: tagFilter || undefined,
      sortKey,
      sortDirection,
    }),
    [selectedDate, showAllDates, search, tagFilter, sortKey, sortDirection],
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

  const syncExpenseSubscriptionLink = useCallback(
    async (expense: Expense, nextTags: string[]) => {
      if (!repo.createSubscription || !repo.updateSubscription) return;

      const tagged = isSubscriptionExpense({ tags: nextTags });
      const existing = subscriptions.find(
        (s) => s.id === expense.subscriptionId || s.expenseId === expense.id,
      );

      if (tagged && !existing) {
        const draft = subscriptionFromExpense({ ...expense, tags: nextTags });
        await repo.createSubscription(draft);
        await refresh();
        return;
      }

      if (tagged && existing) {
        await repo.updateSubscription(existing.id, {
          title: expense.itemName || existing.title,
          amount: expense.amount,
          expenseId: expense.id,
        });
        await refresh();
        return;
      }

      if (!tagged && existing?.expenseId === expense.id) {
        await repo.updateSubscription(existing.id, { expenseId: null });
        await refresh();
      }
    },
    [repo, refresh, subscriptions],
  );

  const updateExpense = useCallback(
    async (id: string, patch: Partial<ExpenseDraft>) => {
      const current = expenses.find((item) => item.id === id);
      const nextTags =
        patch.tags !== undefined ? normalizeTags(patch.tags) : current?.tags ?? [];

      setExpenses((list) =>
        list.map((item) => {
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
            tags: patch.tags !== undefined ? nextTags : item.tags,
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
      if (current && patch.tags !== undefined) {
        await syncExpenseSubscriptionLink(
          { ...current, tags: nextTags },
          nextTags,
        );
      }
      void syncQuietly();
    },
    [expenses, repo, syncExpenseSubscriptionLink, syncQuietly],
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

  const addSubscription = useCallback(
    async (draft: SubscriptionDraft) => {
      if (!repo.createSubscription) {
        throw new Error("الاشتراكات غير مدعومة");
      }
      const created = await repo.createSubscription(draft);
      await refresh();
      if (created.notifyEnabled) {
        await syncCalendarEvent(created);
      }
      return created;
    },
    [repo, refresh, syncCalendarEvent],
  );

  const updateSubscription = useCallback(
    async (id: string, patch: Partial<SubscriptionDraft>) => {
      if (!repo.updateSubscription) {
        throw new Error("الاشتراكات غير مدعومة");
      }
      const updated = await repo.updateSubscription(id, patch);
      await refresh();
      if (updated.notifyEnabled) {
        await syncCalendarEvent(updated);
      }
      return updated;
    },
    [repo, refresh, syncCalendarEvent],
  );

  const deleteSubscription = useCallback(
    async (id: string) => {
      if (!repo.deleteSubscription) return;
      await repo.deleteSubscription(id);
      await refresh();
    },
    [repo, refresh],
  );

  const getSubscriptionForExpense = useCallback(
    (expenseId: string) =>
      subscriptions.find(
        (s) => s.expenseId === expenseId || expenses.find((e) => e.id === expenseId)?.subscriptionId === s.id,
      ) ?? null,
    [subscriptions, expenses],
  );

  const syncSubscriptionReminders = useCallback(
    async (subscriptionId: string, patch: Partial<SubscriptionDraft>) => {
      const updated = await updateSubscription(subscriptionId, patch);
      if (updated.notifyEnabled) {
        await syncCalendarEvent(updated);
      }
    },
    [updateSubscription, syncCalendarEvent],
  );

  const value = useMemo<ExpensesContextValue>(
    () => ({
      expenses,
      visibleExpenses,
      subscriptions,
      profile,
      loading,
      selectedDate,
      search,
      tagFilter,
      sortKey,
      sortDirection,
      pendingUndo,
      showAllDates,
      setSelectedDate,
      setShowAllDates,
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
      addSubscription,
      updateSubscription,
      deleteSubscription,
      getSubscriptionForExpense,
      syncSubscriptionReminders,
    }),
    [
      expenses,
      visibleExpenses,
      subscriptions,
      profile,
      loading,
      selectedDate,
      search,
      tagFilter,
      sortKey,
      sortDirection,
      pendingUndo,
      showAllDates,
      setSort,
      refresh,
      addExpense,
      updateExpense,
      deleteExpense,
      undoDelete,
      dismissUndo,
      updateCurrency,
      addSubscription,
      updateSubscription,
      deleteSubscription,
      getSubscriptionForExpense,
      syncSubscriptionReminders,
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
