"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Link2, RefreshCw, Unplug } from "lucide-react";
import { useExpenses } from "@/components/expenses/expenses-provider";
import {
  connectGoogleSheets,
  createMasroofySpreadsheet,
  disconnectGoogleSheets,
  ensureGoogleAccessToken,
  isGoogleConfigured,
  loadGoogleConnection,
  saveGoogleConnection,
  writeExpensesToSpreadsheet,
  type GoogleSheetsConnection,
} from "@/lib/google/sheets";

export function GoogleSheetsPanel() {
  const { expenses } = useExpenses();
  const [connection, setConnection] = useState<GoogleSheetsConnection | null>(null);
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
        <h2 className="mb-1 font-medium">الربط المباشر مع Google Sheets</h2>
        <p className="mb-4 text-sm leading-7 text-[var(--muted-foreground)]">
          بعد الربط، كل إضافة أو تعديل أو حذف لمصروف يُحدَّث تلقائيًا في جدول Google
          المرتبط بحساب Gmail الخاص بك.
        </p>

        {!configured && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            الربط المباشر يحتاج ضبط{" "}
            <code className="rounded bg-white px-1">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>{" "}
            مرة واحدة (انظر الدليل بالأسفل). حتى ذلك الحين يمكنك التصدير يدويًا من تبويب
            التصدير.
          </div>
        )}

        {connection?.email ? (
          <div className="space-y-3 text-sm">
            <p>
              الحساب المرتبط:{" "}
              <span className="font-medium text-[var(--foreground)]">
                {connection.email}
              </span>
            </p>
            {connection.spreadsheetUrl ? (
              <p className="flex flex-wrap items-center gap-2">
                الجدول:{" "}
                <a
                  href={connection.spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline"
                >
                  {connection.spreadsheetTitle || "فتح Google Sheets"}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </p>
            ) : (
              <p className="text-[var(--muted-foreground)]">
                لا يوجد جدول مرتبط بعد — أنشئ واحدًا بالزر أدناه.
              </p>
            )}

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={connection.autoSync}
                onChange={(event) => {
                  const next = {
                    ...connection,
                    autoSync: event.target.checked,
                  };
                  saveGoogleConnection(next);
                  setConnection(next);
                }}
              />
              مزامنة تلقائية عند إضافة/تعديل/حذف المصروفات
            </label>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={busy || !configured}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm text-white disabled:opacity-50"
                onClick={() =>
                  void run(async () => {
                    const accessToken = await ensureGoogleAccessToken();
                    const created = await createMasroofySpreadsheet(accessToken);
                    const current = loadGoogleConnection();
                    if (!current) return;
                    const next = {
                      ...current,
                      accessToken,
                      spreadsheetId: created.spreadsheetId,
                      spreadsheetUrl: created.spreadsheetUrl,
                      spreadsheetTitle: created.title,
                      autoSync: true,
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
                إنشاء جدول جديد ومزامنته
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
                    setMessage("تمت المزامنة اليدوية بنجاح");
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
                  disconnectGoogleSheets();
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
                await connectGoogleSheets();
                setMessage("تم تسجيل الدخول بحساب Google. أنشئ جدولًا للمزامنة.");
              })
            }
          >
            ربط حساب Gmail / Google
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

      <details open className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-7 text-[var(--muted-foreground)]">
        <summary className="cursor-pointer font-medium text-[var(--foreground)]">
          دليل الاستخدام الكامل — Google Sheets
        </summary>
        <div className="mt-3 space-y-4">
          <div>
            <p className="mb-1 font-medium text-[var(--foreground)]">
              أ) إعداد مرة واحدة (ضروري للربط المباشر)
            </p>
            <ol className="list-decimal space-y-1 pe-5">
              <li>
                ادخل إلى{" "}
                <a
                  className="text-[var(--accent)] hover:underline"
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Google Cloud Console
                </a>{" "}
                بنفس حساب Gmail.
              </li>
              <li>أنشئ مشروعًا جديدًا باسم مثل «مصروفي».</li>
              <li>
                من القائمة: APIs & Services ← Library ← فعّل{" "}
                <strong className="text-[var(--foreground)]">Google Sheets API</strong> و{" "}
                <strong className="text-[var(--foreground)]">Google Drive API</strong>.
              </li>
              <li>
                APIs & Services ← OAuth consent screen ← External ← أدخل اسم التطبيق
                «مصروفي» وبريدك ثم Save.
              </li>
              <li>
                Credentials ← Create Credentials ← OAuth client ID ← Application type:{" "}
                <strong className="text-[var(--foreground)]">Web application</strong>.
              </li>
              <li>
                في Authorized JavaScript origins أضف:
                <br />
                <code className="rounded bg-white px-1">http://localhost:3737</code>
                <br />
                وبعد النشر أضف رابط موقعك أيضًا.
              </li>
              <li>
                انسخ Client ID إلى ملف{" "}
                <code className="rounded bg-white px-1">.env.local</code>:
                <br />
                <code className="rounded bg-white px-1">
                  NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
                </code>
              </li>
              <li>أعد تشغيل التطبيق ثم ارجع هنا واضغط «ربط حساب Gmail».</li>
            </ol>
          </div>

          <div>
            <p className="mb-1 font-medium text-[var(--foreground)]">
              ب) الاستخدام اليومي بعد الربط
            </p>
            <ol className="list-decimal space-y-1 pe-5">
              <li>اضغط «ربط حساب Gmail / Google» واختر حسابك ووافق على الصلاحيات.</li>
              <li>اضغط «إنشاء جدول جديد ومزامنته» — سيظهر جدول في Google Drive.</li>
              <li>اترك خيار المزامنة التلقائية مفعّلاً.</li>
              <li>
                أي مصروف تضيفه أو تعدّله أو تحذفه في مصروفي يُحدَّث في الشيت تلقائيًا.
              </li>
              <li>يمكنك فتح الجدول من الرابط الظاهر هنا في أي وقت.</li>
            </ol>
          </div>

          <div>
            <p className="mb-1 font-medium text-[var(--foreground)]">
              ج) بدون إعداد Google Cloud (بديل سريع)
            </p>
            <ol className="list-decimal space-y-1 pe-5">
              <li>من تبويب «تصدير» اختر الفترة.</li>
              <li>اضغط Google Sheets — سيُنزَّل ملف CSV.</li>
              <li>
                افتح{" "}
                <a
                  className="text-[var(--accent)] hover:underline"
                  href="https://sheets.google.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  sheets.google.com
                </a>{" "}
                ← ملف ← استيراد ← ارفع CSV.
              </li>
            </ol>
          </div>
        </div>
      </details>
    </div>
  );
}
