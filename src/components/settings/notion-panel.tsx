"use client";

import { useEffect, useState } from "react";
import { useExpenses } from "@/components/expenses/expenses-provider";
import {
  clearNotionConnection,
  loadNotionConnection,
  saveNotionConnection,
  syncExpensesToNotion,
  verifyNotionDatabase,
  type NotionConnection,
} from "@/lib/notion/sync";

export function NotionPanel() {
  const { expenses } = useExpenses();
  const [token, setToken] = useState("");
  const [databaseId, setDatabaseId] = useState("");
  const [connection, setConnection] = useState<NotionConnection | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const current = loadNotionConnection();
    setConnection(current);
    if (current) {
      setToken(current.token);
      setDatabaseId(current.databaseId);
    }
  }, []);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
        <h2 className="mb-1 font-medium">ربط Notion (تضمين لاحقًا + مزامنة)</h2>
        <p className="mb-4 text-sm leading-7 text-[var(--muted-foreground)]">
          أنشئ Integration في Notion واربطها بقاعدة بيانات خصائصها: Name, Amount, Date,
          Tags (multi_select), Notes, ExpenseId. كل تغيير في مصاريفي يُزامن تلقائيًا.
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
            onClick={() => {
              void (async () => {
                setBusy(true);
                setError(null);
                try {
                  const verified = await verifyNotionDatabase(token, databaseId);
                  const next: NotionConnection = {
                    token,
                    databaseId,
                    autoSync: true,
                    lastSyncedAt: null,
                  };
                  saveNotionConnection(next);
                  setConnection(next);
                  await syncExpensesToNotion(expenses);
                  setMessage(`تم الربط مع «${verified.title}» ومزامنة البيانات`);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "فشل الربط");
                } finally {
                  setBusy(false);
                }
              })();
            }}
          >
            حفظ وربط + مزامنة
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
            {connection.lastSyncedAt ? ` — آخر مزامنة: ${connection.lastSyncedAt}` : ""}
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
          <li>notion.so/my-integrations ← New integration ← انسخ Internal Integration Token.</li>
          <li>أنشئ Database في Notion بالخصائص المذكورة أعلاه.</li>
          <li>من قائمة القاعدة: Connections ← أضف الـ Integration.</li>
          <li>انسخ Database ID من رابط القاعدة والصقه هنا.</li>
          <li>للتضمين في صفحة Notion: /embed ثم الصق رابط /embed من نشر مصاريفي.</li>
        </ol>
      </details>
    </div>
  );
}
