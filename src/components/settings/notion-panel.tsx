"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { useExpenses } from "@/components/expenses/expenses-provider";
import { getExpenseRepository } from "@/lib/storage/get-repository";
import {
  clearNotionConnection,
  exportExpensesJson,
  importExpensesFromNotion,
  importExpensesJsonFile,
  loadNotionConnection,
  saveNotionConnection,
  syncExpensesToNotion,
  verifyNotionDatabase,
  type NotionConnection,
} from "@/lib/notion/sync";

export function NotionPanel() {
  const { expenses, refresh } = useExpenses();
  const [token, setToken] = useState("");
  const [databaseId, setDatabaseId] = useState("");
  const [connection, setConnection] = useState<NotionConnection | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const current = loadNotionConnection();
    setConnection(current);
    if (current) {
      setToken(current.token);
      setDatabaseId(current.databaseId);
    }
  }, []);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشلت العملية");
    } finally {
      setBusy(false);
    }
  };

  const mergeImported = async (
    imported: Awaited<ReturnType<typeof importExpensesFromNotion>>,
  ) => {
    const repo = getExpenseRepository();
    if (repo.upsertExpenses) {
      await repo.upsertExpenses(imported);
    } else {
      for (const row of imported) {
        await repo.createExpense({
          amount: row.amount,
          itemName: row.itemName,
          tags: row.tags,
          notes: row.notes,
          spentOn: row.spentOn,
        });
      }
    }
    await refresh();
    await syncExpensesToNotion(await repo.listExpenses());
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
        <h2 className="mb-1 font-medium">ربط Notion — مزامنة فورية</h2>
        <p className="mb-4 text-sm leading-7 text-[var(--muted-foreground)]">
          اربط قاعدة Notion (Name, Amount, Date, Tags, Notes, ExpenseId). كل
          تعديل في مصاريفي يُزامَن تلقائيًا. يمكنك أيضًا استيراد أو تصدير كامل
          البيانات.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Integration Token
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2"
              placeholder="secret_..."
            />
          </label>
          <label className="text-sm">
            Database ID
            <input
              value={databaseId}
              onChange={(e) => setDatabaseId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2"
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !token || !databaseId}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white disabled:opacity-50"
            onClick={() =>
              void run(async () => {
                const verified = await verifyNotionDatabase(token, databaseId);
                const next: NotionConnection = {
                  token,
                  databaseId,
                  autoSync: true,
                  lastSyncedAt: null,
                  lastImportedAt: null,
                };
                saveNotionConnection(next);
                setConnection(next);
                await syncExpensesToNotion(expenses);
                setMessage(`تم الربط مع «${verified.title}» ومزامنة ${expenses.length} سجل`);
              })
            }
          >
            حفظ وربط + مزامنة
          </button>

          <button
            type="button"
            disabled={busy || !connection}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm disabled:opacity-50"
            onClick={() =>
              void run(async () => {
                await syncExpensesToNotion(expenses);
                setMessage("تمت المزامنة اليدوية إلى Notion");
              })
            }
          >
            مزامنة الآن
          </button>

          <button
            type="button"
            disabled={busy || !connection}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm disabled:opacity-50"
            onClick={() =>
              void run(async () => {
                const imported = await importExpensesFromNotion();
                await mergeImported(imported);
                setMessage(`تم استيراد ${imported.length} سجل من Notion`);
              })
            }
          >
            <Download className="h-4 w-4" />
            استيراد من Notion
          </button>

          <button
            type="button"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
            onClick={() => exportExpensesJson(expenses)}
          >
            <Upload className="h-4 w-4" />
            تصدير JSON
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void run(async () => {
                const imported = await importExpensesJsonFile(file);
                await mergeImported(imported);
                setMessage(`تم استيراد ${imported.length} سجل من الملف`);
              });
              event.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
            onClick={() => fileRef.current?.click()}
          >
            استيراد JSON
          </button>

          {connection && (
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--danger)]"
              onClick={() => {
                clearNotionConnection();
                setConnection(null);
                setMessage("تم فصل Notion");
              }}
            >
              فصل
            </button>
          )}
        </div>

        {connection?.autoSync && (
          <p className="mt-3 text-xs text-[var(--success)]">
            المزامنة التلقائية مفعّلة
            {connection.lastSyncedAt
              ? ` — آخر مزامنة: ${new Date(connection.lastSyncedAt).toLocaleString("ar-EG")}`
              : ""}
          </p>
        )}
        {message && (
          <p className="mt-3 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--accent)]">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--danger)]">
            {error}
          </p>
        )}
      </section>

      <details className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-7">
        <summary className="cursor-pointer font-medium">دليل Notion السريع</summary>
        <ol className="mt-2 list-decimal space-y-1 pe-5 text-[var(--muted-foreground)]">
          <li>notion.so/my-integrations ← New integration ← انسخ Token.</li>
          <li>أنشئ Database بالخصائص: Name, Amount, Date, Tags, Notes, ExpenseId.</li>
          <li>Connections ← أضف الـ Integration للقاعدة.</li>
          <li>انسخ Database ID من الرابط والصقه هنا.</li>
        </ol>
      </details>
    </div>
  );
}
