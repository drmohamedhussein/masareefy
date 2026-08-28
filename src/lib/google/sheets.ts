import type { Expense } from "@/core/types";
import { toSheetMatrix } from "@/core/export";
import {
  connectGoogle,
  disconnectGoogle,
  ensureGoogleAccessToken,
  getGoogleClientId,
  isGoogleConfigured,
  loadGoogleConnection,
  saveGoogleConnection,
  type GoogleConnection,
} from "@/lib/google/auth";

export type { GoogleConnection };
export {
  connectGoogle,
  connectGoogle as connectGoogleSheets,
  disconnectGoogle,
  disconnectGoogle as disconnectGoogleSheets,
  ensureGoogleAccessToken,
  getGoogleClientId,
  isGoogleConfigured,
  loadGoogleConnection,
  saveGoogleConnection,
};

/** @deprecated use GoogleConnection */
export type GoogleSheetsConnection = GoogleConnection & {
  autoSync: boolean;
};

export function loadGoogleConnectionAsSheets(): GoogleSheetsConnection | null {
  const c = loadGoogleConnection();
  if (!c) return null;
  return { ...c, autoSync: c.sheetsAutoSync };
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
  if (!connection?.sheetsAutoSync || !connection.spreadsheetId) return;

  const accessToken = await ensureGoogleAccessToken();
  await writeExpensesToSpreadsheet(
    accessToken,
    connection.spreadsheetId,
    expenses,
  );
}

/** Back-compat alias */
export const loadGoogleConnectionLegacy = loadGoogleConnection;
