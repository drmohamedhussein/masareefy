import type { Expense } from "@/core/types";
import { normalizeTags } from "@/core/export";

const STORAGE_KEY = "masareefy.notion.v1";

export interface NotionConnection {
  token: string;
  databaseId: string;
  autoSync: boolean;
  lastSyncedAt: string | null;
  lastImportedAt: string | null;
}

export function loadNotionConnection(): NotionConnection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NotionConnection;
    return {
      ...parsed,
      lastImportedAt: parsed.lastImportedAt ?? null,
    };
  } catch {
    return null;
  }
}

export function saveNotionConnection(connection: NotionConnection): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(connection));
}

export function clearNotionConnection(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export async function verifyNotionDatabase(
  token: string,
  databaseId: string,
): Promise<{ title: string }> {
  const response = await fetch("/api/notion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "verify", token, databaseId }),
  });
  const data = (await response.json()) as { title?: string; error?: string };
  if (!response.ok) {
    throw new Error(data.error || "تعذر التحقق من Notion");
  }
  return { title: data.title || "Notion DB" };
}

export async function syncExpensesToNotion(expenses: Expense[]): Promise<void> {
  const connection = loadNotionConnection();
  if (!connection?.autoSync || !connection.token || !connection.databaseId) {
    return;
  }

  const response = await fetch("/api/notion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "sync",
      token: connection.token,
      databaseId: connection.databaseId,
      expenses,
    }),
  });

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error || "فشلت مزامنة Notion");
  }

  saveNotionConnection({
    ...connection,
    lastSyncedAt: new Date().toISOString(),
  });
}

export async function importExpensesFromNotion(): Promise<Expense[]> {
  const connection = loadNotionConnection();
  if (!connection?.token || !connection.databaseId) {
    throw new Error("Notion غير مربوط");
  }

  const response = await fetch("/api/notion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "import",
      token: connection.token,
      databaseId: connection.databaseId,
    }),
  });

  const data = (await response.json()) as {
    expenses?: Expense[];
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error || "فشل الاستيراد من Notion");
  }

  saveNotionConnection({
    ...connection,
    lastImportedAt: new Date().toISOString(),
  });

  return data.expenses ?? [];
}

export function exportExpensesJson(expenses: Expense[]): void {
  const blob = new Blob([JSON.stringify(expenses, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `masareefy-export-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importExpensesJsonFile(
  file: File,
): Promise<Expense[]> {
  const text = await file.text();
  const parsed = JSON.parse(text) as Expense[];
  if (!Array.isArray(parsed)) {
    throw new Error("ملف JSON غير صالح");
  }
  return parsed.map((row) => ({
    ...row,
    tags: normalizeTags(row.tags),
    subscriptionId: row.subscriptionId ?? null,
  }));
}
