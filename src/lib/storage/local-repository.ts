import { filterExpenses } from "@/core/expense-filters";
import { todayISO } from "@/core/date-range";
import { normalizeTags } from "@/core/export";
import type {
  CurrencyCode,
  Expense,
  ExpenseDraft,
  ExpenseQuery,
  Profile,
  RecurringExpense,
} from "@/core/types";
import type { ExpenseRepository } from "@/core/repository";
import { mirrorLocalStorageToPreferences } from "@/lib/storage/preferences-bridge";

const STORAGE_KEY = "masareefy.v1";
const LEGACY_KEY = "Masareefy.v1";
const LOCAL_USER_ID = "local-user";

interface LocalStore {
  profile: Profile;
  expenses: Expense[];
  recurring: RecurringExpense[];
}

function defaultStore(): LocalStore {
  const now = new Date().toISOString();
  return {
    profile: {
      id: LOCAL_USER_ID,
      displayName: "أنا",
      currency: "EGP",
      timezone: "Africa/Cairo",
      monthlyBudget: null,
      createdAt: now,
    },
    expenses: [],
    recurring: [],
  };
}

function migrateExpense(raw: Partial<Expense> & { id: string }): Expense {
  return {
    id: raw.id,
    userId: raw.userId ?? LOCAL_USER_ID,
    amount: raw.amount ?? null,
    itemName: raw.itemName ?? "",
    tags: normalizeTags(raw.tags),
    notes: raw.notes ?? null,
    spentOn: raw.spentOn ?? todayISO(),
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}

function readStore(): LocalStore {
  if (typeof window === "undefined") return defaultStore();

  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return defaultStore();
    const parsed = JSON.parse(raw) as Partial<LocalStore> & {
      expenses?: Array<Partial<Expense> & { id: string }>;
    };
    if (!parsed?.profile || !Array.isArray(parsed.expenses)) {
      return defaultStore();
    }
    const store: LocalStore = {
      profile: {
        ...defaultStore().profile,
        ...parsed.profile,
        monthlyBudget: parsed.profile.monthlyBudget ?? null,
      },
      expenses: parsed.expenses.map(migrateExpense),
      recurring: Array.isArray(parsed.recurring) ? parsed.recurring : [],
    };
    writeStore(store);
    return store;
  } catch {
    return defaultStore();
  }
}

function writeStore(store: LocalStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  void mirrorLocalStorageToPreferences();
}

function createId(prefix = "exp"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export class LocalExpenseRepository implements ExpenseRepository {
  async listExpenses(query: ExpenseQuery = {}): Promise<Expense[]> {
    const { expenses } = readStore();
    return filterExpenses(expenses, query);
  }

  async getExpense(id: string): Promise<Expense | null> {
    const { expenses } = readStore();
    return expenses.find((item) => item.id === id) ?? null;
  }

  async createExpense(draft: ExpenseDraft): Promise<Expense> {
    const store = readStore();
    const now = new Date().toISOString();
    const expense: Expense = {
      id: createId(),
      userId: LOCAL_USER_ID,
      amount: draft.amount != null && draft.amount > 0 ? draft.amount : null,
      itemName: draft.itemName ?? "",
      tags: normalizeTags(draft.tags),
      notes: draft.notes?.trim() ? draft.notes.trim() : null,
      spentOn: draft.spentOn || todayISO(),
      createdAt: now,
      updatedAt: now,
    };

    store.expenses.unshift(expense);
    writeStore(store);
    return expense;
  }

  async updateExpense(
    id: string,
    patch: Partial<ExpenseDraft>,
  ): Promise<Expense> {
    const store = readStore();
    const index = store.expenses.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new Error("المصروف غير موجود");
    }

    const current = store.expenses[index]!;
    const nextAmount =
      patch.amount !== undefined
        ? patch.amount != null && patch.amount > 0
          ? patch.amount
          : null
        : current.amount;

    const updated: Expense = {
      ...current,
      amount: nextAmount,
      itemName:
        patch.itemName !== undefined ? patch.itemName : current.itemName,
      tags: patch.tags !== undefined ? normalizeTags(patch.tags) : current.tags,
      notes:
        patch.notes !== undefined
          ? patch.notes?.trim()
            ? patch.notes.trim()
            : null
          : current.notes,
      spentOn: patch.spentOn ?? current.spentOn,
      updatedAt: new Date().toISOString(),
    };

    store.expenses[index] = updated;
    writeStore(store);
    return updated;
  }

  async deleteExpense(id: string): Promise<void> {
    const store = readStore();
    store.expenses = store.expenses.filter((item) => item.id !== id);
    writeStore(store);
  }

  async getProfile(): Promise<Profile | null> {
    return readStore().profile;
  }

  async updateProfile(
    patch: Partial<
      Pick<Profile, "displayName" | "currency" | "timezone" | "monthlyBudget">
    >,
  ): Promise<Profile> {
    const store = readStore();
    store.profile = {
      ...store.profile,
      displayName:
        patch.displayName !== undefined
          ? patch.displayName
          : store.profile.displayName,
      currency:
        (patch.currency as CurrencyCode | undefined) ?? store.profile.currency,
      timezone: patch.timezone ?? store.profile.timezone,
      monthlyBudget:
        patch.monthlyBudget !== undefined
          ? patch.monthlyBudget
          : store.profile.monthlyBudget,
    };
    writeStore(store);
    return store.profile;
  }

  async listRecurring(): Promise<RecurringExpense[]> {
    return readStore().recurring;
  }

  async saveRecurring(items: RecurringExpense[]): Promise<void> {
    const store = readStore();
    store.recurring = items;
    writeStore(store);
  }
}

export function createLocalRepository(): ExpenseRepository {
  return new LocalExpenseRepository();
}

export function createRecurringId(): string {
  return createId("rec");
}
