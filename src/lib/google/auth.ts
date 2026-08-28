/**
 * Unified Google OAuth — Sheets + Drive + Calendar in one consent flow.
 */

export const GOOGLE_STORAGE_KEY = "masareefy.google.v1";
const LEGACY_SHEETS_KEY = "Masareefy.google.sheets.v1";
const LEGACY_CALENDAR_KEY = "masareefy.google.calendar.v1";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/calendar.events",
  "openid",
  "email",
  "profile",
].join(" ");

export interface GoogleConnection {
  accessToken: string;
  expiresAt: number;
  email: string | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  spreadsheetTitle: string | null;
  sheetsAutoSync: boolean;
  calendarId: string;
  calendarAutoSync: boolean;
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

function defaultConnection(): GoogleConnection {
  return {
    accessToken: "",
    expiresAt: 0,
    email: null,
    spreadsheetId: null,
    spreadsheetUrl: null,
    spreadsheetTitle: null,
    sheetsAutoSync: true,
    calendarId: "primary",
    calendarAutoSync: true,
  };
}

function migrateLegacy(): GoogleConnection | null {
  if (typeof window === "undefined") return null;
  try {
    const sheetsRaw = window.localStorage.getItem(LEGACY_SHEETS_KEY);
    const calRaw = window.localStorage.getItem(LEGACY_CALENDAR_KEY);
    if (!sheetsRaw && !calRaw) return null;

    const sheets = sheetsRaw
      ? (JSON.parse(sheetsRaw) as {
          accessToken: string;
          expiresAt: number;
          email: string | null;
          spreadsheetId: string | null;
          spreadsheetUrl: string | null;
          spreadsheetTitle: string | null;
          autoSync: boolean;
        })
      : null;
    const cal = calRaw
      ? (JSON.parse(calRaw) as {
          accessToken: string;
          expiresAt: number;
          email: string | null;
          calendarId: string;
          autoSync: boolean;
        })
      : null;

    const merged: GoogleConnection = {
      accessToken: sheets?.accessToken || cal?.accessToken || "",
      expiresAt: Math.max(sheets?.expiresAt ?? 0, cal?.expiresAt ?? 0),
      email: sheets?.email ?? cal?.email ?? null,
      spreadsheetId: sheets?.spreadsheetId ?? null,
      spreadsheetUrl: sheets?.spreadsheetUrl ?? null,
      spreadsheetTitle: sheets?.spreadsheetTitle ?? null,
      sheetsAutoSync: sheets?.autoSync ?? true,
      calendarId: cal?.calendarId ?? "primary",
      calendarAutoSync: cal?.autoSync ?? true,
    };

    saveGoogleConnection(merged);
    window.localStorage.removeItem(LEGACY_SHEETS_KEY);
    window.localStorage.removeItem(LEGACY_CALENDAR_KEY);
    return merged;
  } catch {
    return null;
  }
}

export function loadGoogleConnection(): GoogleConnection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(GOOGLE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GoogleConnection;
      return { ...defaultConnection(), ...parsed };
    }
    return migrateLegacy();
  } catch {
    return null;
  }
}

export function saveGoogleConnection(connection: GoogleConnection): void {
  window.localStorage.setItem(GOOGLE_STORAGE_KEY, JSON.stringify(connection));
}

export function clearGoogleConnection(): void {
  window.localStorage.removeItem(GOOGLE_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_SHEETS_KEY);
  window.localStorage.removeItem(LEGACY_CALENDAR_KEY);
}

function loadGisScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("window"));
  if (window.google?.accounts?.oauth2) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-masareefy-gis="1"]',
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
    script.dataset.masareefyGis = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("تعذر تحميل تسجيل دخول Google"));
    document.head.appendChild(script);
  });
}

async function fetchGoogleEmail(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { email?: string };
    return data.email ?? null;
  } catch {
    return null;
  }
}

async function requestToken(prompt: "" | "consent"): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error("لم يتم ضبط NEXT_PUBLIC_GOOGLE_CLIENT_ID بعد");
  }

  await loadGisScript();
  if (!window.google?.accounts?.oauth2) {
    throw new Error("Google Identity غير متاح");
  }

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_SCOPES,
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
    client.requestAccessToken(prompt ? { prompt } : {});
  });
}

/** First-time connect — full consent for Sheets + Drive + Calendar */
export async function connectGoogle(): Promise<GoogleConnection> {
  const token = await requestToken("consent");
  const email = await fetchGoogleEmail(token.access_token);
  const previous = loadGoogleConnection();
  const connection: GoogleConnection = {
    accessToken: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000 - 30_000,
    email,
    spreadsheetId: previous?.spreadsheetId ?? null,
    spreadsheetUrl: previous?.spreadsheetUrl ?? null,
    spreadsheetTitle: previous?.spreadsheetTitle ?? null,
    sheetsAutoSync: previous?.sheetsAutoSync ?? true,
    calendarId: previous?.calendarId ?? "primary",
    calendarAutoSync: previous?.calendarAutoSync ?? true,
  };
  saveGoogleConnection(connection);
  return connection;
}

/** Silent refresh when token expired */
export async function ensureGoogleAccessToken(): Promise<string> {
  const current = loadGoogleConnection();
  if (current?.accessToken && current.expiresAt > Date.now()) {
    return current.accessToken;
  }

  try {
    const token = await requestToken("");
    const email =
      (await fetchGoogleEmail(token.access_token)) ?? current?.email ?? null;
    const connection: GoogleConnection = {
      ...(current ?? defaultConnection()),
      accessToken: token.access_token,
      expiresAt: Date.now() + token.expires_in * 1000 - 30_000,
      email,
    };
    saveGoogleConnection(connection);
    return token.access_token;
  } catch {
    const refreshed = await connectGoogle();
    return refreshed.accessToken;
  }
}

export function disconnectGoogle(): void {
  const current = loadGoogleConnection();
  if (current?.accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(current.accessToken, () => undefined);
  }
  clearGoogleConnection();
}

export function isGoogleConnected(): boolean {
  const c = loadGoogleConnection();
  return Boolean(c?.accessToken);
}
