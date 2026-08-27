import type { Expense } from "@/core/types";
import { toSheetMatrix } from "@/core/export";

const STORAGE_KEY = "Masareefy.google.sheets.v1";
const SCOPES =
  "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file";

export interface GoogleSheetsConnection {
  accessToken: string;
  expiresAt: number;
  email: string | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  spreadsheetTitle: string | null;
  autoSync: boolean;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              expires_in?: number;
              error?: string;
            }) => void;
          }) => { requestAccessToken: (opts?: { prompt?: string }) => void };
          revoke: (token: string, done: () => void) => void;
        };
      };
    };
  }
}

export function getGoogleClientId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || "";
}

export function isGoogleConfigured(): boolean {
  return Boolean(getGoogleClientId());
}

export function loadGoogleConnection(): GoogleSheetsConnection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GoogleSheetsConnection;
  } catch {
    return null;
  }
}

export function saveGoogleConnection(connection: GoogleSheetsConnection): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(connection));
}

export function clearGoogleConnection(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

function loadGisScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("window"));
  if (window.google?.accounts?.oauth2) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-Masareefy-gis="1"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("GIS load failed")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.MasareefyGis = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("تعذر تحميل تسجيل دخول Google"));
    document.head.appendChild(script);
  });
}

export async function connectGoogleSheets(): Promise<GoogleSheetsConnection> {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error("لم يتم ضبط NEXT_PUBLIC_GOOGLE_CLIENT_ID بعد");
  }

  await loadGisScript();
  if (!window.google?.accounts?.oauth2) {
    throw new Error("Google Identity غير متاح");
  }

  const token = await new Promise<{ access_token: string; expires_in: number }>(
    (resolve, reject) => {
      const client = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (response) => {
          if (response.error || !response.access_token) {
            reject(new Error(response.error || "فشل التفويض"));
            return;
          }
          resolve({
            access_token: response.access_token,
            expires_in: response.expires_in ?? 3600,
          });
        },
      });
      client.requestAccessToken({ prompt: "consent" });
    },
  );

  const email = await fetchGoogleEmail(token.access_token);
  const previous = loadGoogleConnection();
  const connection: GoogleSheetsConnection = {
    accessToken: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000 - 30_000,
    email,
    spreadsheetId: previous?.spreadsheetId ?? null,
    spreadsheetUrl: previous?.spreadsheetUrl ?? null,
    spreadsheetTitle: previous?.spreadsheetTitle ?? null,
    autoSync: previous?.autoSync ?? true,
  };
  saveGoogleConnection(connection);
  return connection;
}

export async function ensureGoogleAccessToken(): Promise<string> {
  const current = loadGoogleConnection();
  if (current && current.expiresAt > Date.now() && current.accessToken) {
    return current.accessToken;
  }
  const refreshed = await connectGoogleSheets();
  return refreshed.accessToken;
}

async function fetchGoogleEmail(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { email?: string };
    return data.email ?? null;
  } catch {
    return null;
  }
}

async function sheetsFetch(
  path: string,
  init: RequestInit & { accessToken: string },
): Promise<Response> {
  const { accessToken, ...rest } = init;
  return fetch(`https://sheets.googleapis.com/v4/${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(rest.headers || {}),
    },
  });
}

export async function createMasareefySpreadsheet(
  accessToken: string,
  title = "مصاريفي - المصروفات",
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; title: string }> {
  const response = await sheetsFetch("spreadsheets", {
    method: "POST",
    accessToken,
    body: JSON.stringify({
      properties: { title, locale: "ar_EG" },
      sheets: [{ properties: { title: "المصروفات" } }],
    }),
  });

  if (!response.ok) {
    throw new Error("تعذر إنشاء جدول Google Sheets");
  }

  const data = (await response.json()) as {
    spreadsheetId: string;
    spreadsheetUrl: string;
    properties: { title: string };
  };

  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
    title: data.properties.title,
  };
}

export async function writeExpensesToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  expenses: Expense[],
): Promise<void> {
  const values = toSheetMatrix(expenses);

  const clearRange = async (range: string) => {
    return sheetsFetch(
      `spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`,
      { method: "POST", accessToken, body: "{}" },
    );
  };

  let range = "المصروفات!A:Z";
  let clear = await clearRange(range);
  if (!clear.ok) {
    range = "Sheet1!A:Z";
    clear = await clearRange(range);
  }

  const updateRange = range.replace(/!A:Z$/, "!A1");
  const update = await sheetsFetch(
    `spreadsheets/${spreadsheetId}/values/${encodeURIComponent(updateRange)}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      accessToken,
      body: JSON.stringify({ values }),
    },
  );

  if (!update.ok) {
    const text = await update.text();
    throw new Error(`تعذر كتابة البيانات في Google Sheets: ${text}`);
  }
}

export async function syncExpensesToGoogleSheets(
  expenses: Expense[],
): Promise<void> {
  const connection = loadGoogleConnection();
  if (!connection?.autoSync || !connection.spreadsheetId) return;

  const accessToken = await ensureGoogleAccessToken();
  await writeExpensesToSpreadsheet(
    accessToken,
    connection.spreadsheetId,
    expenses,
  );
}

export function disconnectGoogleSheets(): void {
  const current = loadGoogleConnection();
  if (current?.accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(current.accessToken, () => undefined);
  }
  clearGoogleConnection();
}
