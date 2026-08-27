import type { Expense } from "@/core/types";

const STORAGE_KEY = "masareefy.notion.v1";

export interface NotionConnection {
  token: string;
  databaseId: string;
  autoSync: boolean;
  lastSyncedAt: string | null;
}

export function loadNotionConnection(): NotionConnection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as NotionConnection) : null;
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
