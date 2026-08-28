"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  ExternalLink,
  Link2,
  RefreshCw,
  Unplug,
} from "lucide-react";
import { useExpenses } from "@/components/expenses/expenses-provider";
import { useAuth } from "@/components/auth/auth-provider";
import {
  connectGoogle,
  createMasareefySpreadsheet,
  disconnectGoogle,
  ensureGoogleAccessToken,
  isGoogleConfigured,
  loadGoogleConnection,
  saveGoogleConnection,
  writeExpensesToSpreadsheet,
  type GoogleConnection,
} from "@/lib/google/sheets";

export function GoogleSheetsPanel() {
  const { expenses } = useExpenses();
  const { elevateIfAdminEmail } = useAuth();
  const [connection, setConnection] = useState<GoogleConnection | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const configured = isGoogleConfigured();

  useEffect(() => {
    setConnection(loadGoogleConnection());
  }, []);

  const refreshLocal = () => setConnection(loadGoogleConnection());

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await fn();
      refreshLocal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
        <h2 className="mb-1 font-medium">ربط Google الموحّد</h2>
        <p className="mb-4 text-sm leading-7 text-[var(--muted-foreground)]">
          ربط واحد لحسابك يشمل{" "}
          <strong className="text-[var(--foreground)]">
            Google Sheets + Drive + Calendar
          </strong>
          . توافق مرة واحدة فقط — لا حاجة لإعادة الربط لكل خدمة.
        </p>

        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <strong>خصوصية:</strong> البيانات في حساب Google الخاص بك فقط. كل
          مستخدم يربط حسابه الشخصي.
        </div>

        {!configured && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Google connection is not enabled on this site yet. Contact the site
            administrator if you need sync.
          </div>
        )}

        {connection?.email ? (
          <div className="space-y-3 text-sm">
            <p>
              الحساب:{" "}
              <span className="font-medium text-[var(--foreground)]">
                {connection.email}
              </span>
            </p>

            {connection.spreadsheetUrl ? (
              <p className="flex flex-wrap items-center gap-2">
                Google Sheets:{" "}
                <a
                  href={connection.spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline"
                >
                  {connection.spreadsheetTitle || "فتح الجدول"}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </p>
            ) : (
              <p className="text-[var(--muted-foreground)]">
                لا يوجد جدول بعد — أنشئ واحدًا بالزر أدناه.
              </p>
            )}

            <p className="flex items-center gap-2 text-[var(--muted-foreground)]">
              <Calendar className="h-4 w-4 text-[var(--accent)]" />
              Google Calendar: مفعّل — تذكيرات الاشتراكات تُزامَن تلقائيًا
            </p>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={connection.sheetsAutoSync}
                onChange={(event) => {
                  const next = {
                    ...connection,
                    sheetsAutoSync: event.target.checked,
                  };
                  saveGoogleConnection(next);
                  setConnection(next);
                }}
              />
              مزامنة تلقائية مع Google Sheets
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={connection.calendarAutoSync}
                onChange={(event) => {
                  const next = {
                    ...connection,
                    calendarAutoSync: event.target.checked,
                  };
                  saveGoogleConnection(next);
                  setConnection(next);
                }}
              />
              مزامنة تلقائية مع Google Calendar (تذكيرات الاشتراكات)
            </label>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={busy || !configured}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm text-white disabled:opacity-50"
                onClick={() =>
                  void run(async () => {
                    const accessToken = await ensureGoogleAccessToken();
                    const created = await createMasareefySpreadsheet(accessToken);
                    const current = loadGoogleConnection();
                    if (!current) return;
                    const next = {
                      ...current,
                      accessToken,
                      spreadsheetId: created.spreadsheetId,
                      spreadsheetUrl: created.spreadsheetUrl,
                      spreadsheetTitle: created.title,
                      sheetsAutoSync: true,
                    };
                    saveGoogleConnection(next);
                    await writeExpensesToSpreadsheet(
                      accessToken,
                      created.spreadsheetId,
                      expenses,
                    );
                    setMessage("تم إنشاء الجدول ومزامنة كل المصروفات");
                  })
                }
              >
                <Link2 className="h-4 w-4" />
                إنشاء جدول ومزامنة
              </button>

              <button
                type="button"
                disabled={busy || !connection.spreadsheetId}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm disabled:opacity-50"
                onClick={() =>
                  void run(async () => {
                    const accessToken = await ensureGoogleAccessToken();
                    const current = loadGoogleConnection();
                    if (!current?.spreadsheetId) return;
                    await writeExpensesToSpreadsheet(
                      accessToken,
                      current.spreadsheetId,
                      expenses,
                    );
                    setMessage("تمت المزامنة اليدوية");
                  })
                }
              >
                <RefreshCw className="h-4 w-4" />
                مزامنة الآن
              </button>

              <button
                type="button"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--danger)] disabled:opacity-50"
                onClick={() => {
                  disconnectGoogle();
                  setConnection(null);
                  setMessage("تم فصل حساب Google");
                }}
              >
                <Unplug className="h-4 w-4" />
                فصل الحساب
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={busy || !configured}
            className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            onClick={() =>
              void run(async () => {
                const connected = await connectGoogle();
                await elevateIfAdminEmail(connected.email);
                setMessage(
                  "تم الربط بكل صلاحيات Google (Sheets + Drive + Calendar)",
                );
              })
            }
          >
            ربط حساب Google — كل الصلاحيات مرة واحدة
          </button>
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

    </div>
  );
}
