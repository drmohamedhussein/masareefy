import { filterExpenses } from "@/core/expense-filters";
import { todayISO } from "@/core/date-range";
import { normalizeTags } from "@/core/export";
import { normalizeSpentOn, resolveSpentOn } from "@/core/spent-on";
import type {
  CurrencyCode,
  Expense,
  ExpenseDraft,
  ExpenseQuery,
  Profile,
  RecurringExpense,
  Subscription,
  SubscriptionDraft,
} from "@/core/types";
import { nextRenewalFromDay } from "@/core/subscriptions";
import type { ExpenseRepository } from "@/core/repository";
import { mirrorLocalStorageToPreferences } from "@/lib/storage/preferences-bridge";

export const STORAGE_KEY = "masareefy.v1";

/** Older installs used different keys — merge them once into STORAGE_KEY. */
const LEGACY_STORAGE_KEYS = [
  "Masareefy.v1",
  "masroofy.v1",
  "Masroofy.v1",
] as const;

const LOCAL_USER_ID = "local-user";

interface LocalStore {
  profile: Profile;
  expenses: Expense[];
  recurring: RecurringExpense[];
  subscriptions: Subscription[];
}

function defaultStore(): LocalStore {
  const now = new Date().toISOString();
  return {
    profile: {
      id: LOCAL_USER_ID,
      displayName: "أنا",
      email: null,
      role: "user",
      locale: "en",
      currency: "EGP",
      timezone: "Africa/Cairo",
      monthlyBudget: null,
      adminPinHash: null,
      createdAt: now,
    },
    expenses: [],
    recurring: [],
    subscriptions: [],
  };
}

function migrateSubscription(
  raw: Partial<Subscription> & { id: string },
): Subscription {
  const now = new Date().toISOString();
  const renewalDay = raw.renewalDay ?? 1;
  return {
    id: raw.id,
    title: raw.title ?? "",
    amount: raw.amount ?? null,
    cycle: raw.cycle ?? "monthly",
    renewalDay,
    nextRenewalDate:
      raw.nextRenewalDate ?? nextRenewalFromDay(renewalDay),
    expenseId: raw.expenseId ?? null,
    notifyEnabled: raw.notifyEnabled ?? false,
    notifyDaysBefore: raw.notifyDaysBefore ?? 1,
    notifyTime: raw.notifyTime ?? "09:00",
    googleCalendarEventId: raw.googleCalendarEventId ?? null,
    active: raw.active ?? true,
    notes: raw.notes ?? null,
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  };
}

function migrateExpense(raw: Partial<Expense> & { id: string }): Expense {
  const createdAt = raw.createdAt ?? new Date().toISOString();
  const spentOn =
    normalizeSpentOn(raw.spentOn) ??
    normalizeSpentOn(createdAt.slice(0, 10)) ??
    todayISO();

  return {
    id: raw.id,
    userId: raw.userId ?? LOCAL_USER_ID,
    amount: raw.amount ?? null,
    itemName: raw.itemName ?? "",
    tags: normalizeTags(raw.tags),
    notes: raw.notes ?? null,
    spentOn,
    subscriptionId: raw.subscriptionId ?? null,
    createdAt,
    updatedAt: raw.updatedAt ?? createdAt,
  };
}

function parseStorePayload(
  parsed: Partial<LocalStore> & {
    expenses?: Array<Partial<Expense> & { id: string }>;
  },
): LocalStore | null {
  if (!parsed?.profile || !Array.isArray(parsed.expenses)) {
    return null;
  }

  return {
    profile: {
      ...defaultStore().profile,
      ...parsed.profile,
      email: parsed.profile.email ?? null,
      role: parsed.profile.role ?? "user",
      locale: parsed.profile.locale === "ar" ? "ar" : "en",
      adminPinHash: parsed.profile.adminPinHash ?? null,
      monthlyBudget: parsed.profile.monthlyBudget ?? null,
    },
    expenses: parsed.expenses.map(migrateExpense),
    recurring: Array.isArray(parsed.recurring) ? parsed.recurring : [],
    subscriptions: Array.isArray(parsed.subscriptions)
      ? parsed.subscriptions.map((s) =>
          migrateSubscription(s as Partial<Subscription> & { id: string }),
        )
      : [],
  };
}

function readRawFromKey(key: string): LocalStore | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return parseStorePayload(JSON.parse(raw) as Partial<LocalStore>);
  } catch {
    return null;
  }
}

function mergeStores(stores: LocalStore[]): LocalStore {
  const base = defaultStore();
  if (stores.length === 0) return base;

  const byId = new Map<string, Expense>();
  for (const store of stores) {
    for (const expense of store.expenses) {
      const existing = byId.get(expense.id);
      if (
        !existing ||
        expense.updatedAt.localeCompare(existing.updatedAt) > 0
      ) {
        byId.set(expense.id, expense);
      }
    }
  }

  const profile =
    stores.find((store) => store.profile.displayName)?.profile ??
    stores[0]!.profile;

  const recurring =
    stores.find((store) => store.recurring.length > 0)?.recurring ?? [];

  const subById = new Map<string, Subscription>();
  for (const store of stores) {
    for (const sub of store.subscriptions ?? []) {
      const existing = subById.get(sub.id);
      if (
        !existing ||
        sub.updatedAt.localeCompare(existing.updatedAt) > 0
      ) {
        subById.set(sub.id, sub);
      }
    }
  }

  return {
    profile: { ...base.profile, ...profile },
    expenses: [...byId.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    ),
    recurring,
    subscriptions: [...subById.values()].sort((a, b) =>
      a.nextRenewalDate.localeCompare(b.nextRenewalDate),
    ),
  };
}

function consolidateLegacyStorage(): LocalStore {
  const candidates: LocalStore[] = [];
  const primary = readRawFromKey(STORAGE_KEY);
  if (primary) candidates.push(primary);

  for (const key of LEGACY_STORAGE_KEYS) {
    const legacy = readRawFromKey(key);
    if (legacy) candidates.push(legacy);
  }

  const merged = mergeStores(candidates);
  writeStore(merged);

  for (const key of LEGACY_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }

  return merged;
}

function readStore(): LocalStore {
  if (typeof window === "undefined") return defaultStore();

  try {
    const hasLegacy = LEGACY_STORAGE_KEYS.some(
      (key) => window.localStorage.getItem(key) != null,
    );
    if (hasLegacy) {
      return consolidateLegacyStorage();
    }

    const primary = readRawFromKey(STORAGE_KEY);
    return primary ?? defaultStore();
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
      spentOn: resolveSpentOn(draft.spentOn),
      subscriptionId: null,
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
      spentOn:
        patch.spentOn !== undefined
          ? resolveSpentOn(patch.spentOn, current.spentOn)
          : current.spentOn,
      updatedAt: new Date().toISOString(),
    };

    store.expenses[index] = updated;
    writeStore(store);
    return updated;
  }

  async deleteExpense(id: string): Promise<void> {
    const store = readStore();
    store.expenses = store.expenses.filter((item) => item.id !== id);
    store.subscriptions = store.subscriptions.map((sub) =>
      sub.expenseId === id ? { ...sub, expenseId: null } : sub,
    );
    writeStore(store);
  }

  async upsertExpenses(items: Expense[]): Promise<void> {
    const store = readStore();
    const byId = new Map(store.expenses.map((e) => [e.id, e]));
    const now = new Date().toISOString();
    for (const item of items) {
      const existing = byId.get(item.id);
      byId.set(item.id, {
        ...item,
        userId: LOCAL_USER_ID,
        subscriptionId: item.subscriptionId ?? existing?.subscriptionId ?? null,
        createdAt: existing?.createdAt ?? item.createdAt ?? now,
        updatedAt: now,
      });
    }
    store.expenses = [...byId.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    writeStore(store);
  }

  async listSubscriptions(): Promise<Subscription[]> {
    return readStore().subscriptions;
  }

  async createSubscription(draft: SubscriptionDraft): Promise<Subscription> {
    const store = readStore();
    const now = new Date().toISOString();
    const renewalDay = draft.renewalDay ?? 1;
    const sub: Subscription = {
      id: createId("sub"),
      title: draft.title,
      amount: draft.amount ?? null,
      cycle: draft.cycle ?? "monthly",
      renewalDay,
      nextRenewalDate:
        draft.nextRenewalDate ?? nextRenewalFromDay(renewalDay),
      expenseId: draft.expenseId ?? null,
      notifyEnabled: draft.notifyEnabled ?? false,
      notifyDaysBefore: draft.notifyDaysBefore ?? 1,
      notifyTime: draft.notifyTime ?? "09:00",
      googleCalendarEventId: null,
      active: draft.active ?? true,
      notes: draft.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    store.subscriptions.unshift(sub);
    if (sub.expenseId) {
      store.expenses = store.expenses.map((e) =>
        e.id === sub.expenseId ? { ...e, subscriptionId: sub.id } : e,
      );
    }
    writeStore(store);
    return sub;
  }

  async updateSubscription(
    id: string,
    patch: Partial<SubscriptionDraft>,
  ): Promise<Subscription> {
    const store = readStore();
    const index = store.subscriptions.findIndex((s) => s.id === id);
    if (index < 0) throw new Error("الاشتراك غير موجود");
    const current = store.subscriptions[index]!;
    const renewalDay = patch.renewalDay ?? current.renewalDay;
    const updated: Subscription = {
      ...current,
      title: patch.title ?? current.title,
      amount: patch.amount !== undefined ? patch.amount : current.amount,
      cycle: patch.cycle ?? current.cycle,
      renewalDay,
      nextRenewalDate:
        patch.nextRenewalDate ??
        (patch.renewalDay != null
          ? nextRenewalFromDay(renewalDay)
          : current.nextRenewalDate),
      expenseId:
        patch.expenseId !== undefined ? patch.expenseId : current.expenseId,
      notifyEnabled:
        patch.notifyEnabled !== undefined
          ? patch.notifyEnabled
          : current.notifyEnabled,
      notifyDaysBefore:
        patch.notifyDaysBefore !== undefined
          ? patch.notifyDaysBefore
          : current.notifyDaysBefore,
      notifyTime: patch.notifyTime ?? current.notifyTime,
      googleCalendarEventId:
        patch.googleCalendarEventId !== undefined
          ? patch.googleCalendarEventId
          : current.googleCalendarEventId,
      active: patch.active !== undefined ? patch.active : current.active,
      notes:
        patch.notes !== undefined
          ? patch.notes?.trim()
            ? patch.notes.trim()
            : null
          : current.notes,
      updatedAt: new Date().toISOString(),
    };
    store.subscriptions[index] = updated;
    writeStore(store);
    return updated;
  }

  async deleteSubscription(id: string): Promise<void> {
    const store = readStore();
    store.subscriptions = store.subscriptions.filter((s) => s.id !== id);
    store.expenses = store.expenses.map((e) =>
      e.subscriptionId === id ? { ...e, subscriptionId: null } : e,
    );
    writeStore(store);
  }

  async getProfile(): Promise<Profile | null> {
    return readStore().profile;
  }

  async updateProfile(
    patch: Partial<
      Pick<
        Profile,
        | "displayName"
        | "email"
        | "role"
        | "currency"
        | "timezone"
        | "monthlyBudget"
        | "adminPinHash"
        | "locale"
      >
    >,
  ): Promise<Profile> {
    const store = readStore();
    store.profile = {
      ...store.profile,
      displayName:
        patch.displayName !== undefined
          ? patch.displayName
          : store.profile.displayName,
      email: patch.email !== undefined ? patch.email : store.profile.email,
      role: patch.role !== undefined ? patch.role : store.profile.role,
      currency:
        (patch.currency as CurrencyCode | undefined) ?? store.profile.currency,
      timezone: patch.timezone ?? store.profile.timezone,
      monthlyBudget:
        patch.monthlyBudget !== undefined
          ? patch.monthlyBudget
          : store.profile.monthlyBudget,
      adminPinHash:
        patch.adminPinHash !== undefined
          ? patch.adminPinHash
          : store.profile.adminPinHash,
      locale:
        patch.locale !== undefined ? patch.locale : store.profile.locale,
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

export function createSubscriptionId(): string {
  return createId("sub");
}
