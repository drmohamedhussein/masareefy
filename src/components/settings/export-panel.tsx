"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, FileText, Sheet } from "lucide-react";
import { useExpenses } from "@/components/expenses/expenses-provider";
import {
  selectExpensesForExport,
  type ExportScope,
} from "@/core/export";
import { downloadExpensesCsv, downloadExpensesExcel } from "@/lib/export/excel";
import { downloadExpensesPdf } from "@/lib/export/pdf";
import {
  connectGoogleSheets,
  createMasareefySpreadsheet,
  ensureGoogleAccessToken,
  isGoogleConfigured,
  loadGoogleConnection,
  saveGoogleConnection,
  writeExpensesToSpreadsheet,
} from "@/lib/google/sheets";
import { cn } from "@/lib/utils";
import { todayISO } from "@/core/date-range";

const SCOPE_OPTIONS: Array<{ id: ExportScope; label: string }> = [
  { id: "all", label: "كل المصروفات" },
  { id: "today", label: "اليوم" },
  { id: "this_week", label: "هذا الأسبوع" },
  { id: "this_month", label: "هذا الشهر" },
  { id: "last_month", label: "الشهر الماضي" },
  { id: "custom", label: "فترة مخصصة" },
];

export function ExportPanel() {
  const { expenses, profile } = useExpenses();
  const [scope, setScope] = useState<ExportScope>("all");
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => selectExpensesForExport(expenses, { scope, from, to }),
    [expenses, scope, from, to],
  );

  const run = async (action: string, fn: () => Promise<void> | void) => {
    setBusy(action);
    setError(null);
    setMessage(null);
    try {
      await fn();
      setMessage("تم التصدير بنجاح");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل التصدير");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
        <h2 className="mb-1 font-medium">نطاق التصدير</h2>
        <p className="mb-3 text-xs text-[var(--muted-foreground)]">
          اختر كل الحساب أو فترة محددة ثم صدّر بالصيغة المناسبة
        </p>
        <div className="flex flex-wrap gap-2">
          {SCOPE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setScope(option.id)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm",
                scope === option.id
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--border)] hover:bg-[var(--hover)]",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {scope === "custom" && (
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <label className="flex items-center gap-2">
              من
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-md border border-[var(--border)] px-2 py-1.5"
              />
            </label>
            <label className="flex items-center gap-2">
              إلى
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-md border border-[var(--border)] px-2 py-1.5"
              />
            </label>
          </div>
        )}

        <p className="mt-3 text-sm text-[var(--muted-foreground)]">
          عدد الصفوف المحددة:{" "}
          <span className="font-semibold text-[var(--foreground)]">
            {selected.length}
          </span>
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <ExportButton
          icon={<FileSpreadsheet className="h-4 w-4" />}
          title="Microsoft Excel"
          subtitle="ملف .xlsx يفتح على Excel وWPS"
          busy={busy === "excel"}
          disabled={Boolean(busy) || selected.length === 0}
          onClick={() =>
            void run("excel", () => {
              downloadExpensesExcel(selected);
            })
          }
        />
        <ExportButton
          icon={<Sheet className="h-4 w-4" />}
          title="Google Sheets"
          subtitle="إنشاء/تحديث شيت في حسابك أو تنزيل CSV"
          busy={busy === "sheets"}
          disabled={Boolean(busy) || selected.length === 0}
          onClick={() =>
            void run("sheets", async () => {
              if (!isGoogleConfigured()) {
                downloadExpensesCsv(selected);
                setMessage(
                  "تم تنزيل CSV لرفعه على Google Sheets (الربط المباشر يحتاج إعداد Client ID)",
                );
                return;
              }

              const accessToken = await ensureGoogleAccessToken();
              let connection = loadGoogleConnection();
              if (!connection?.spreadsheetId) {
                const created = await createMasareefySpreadsheet(accessToken);
                connection = {
                  accessToken,
                  expiresAt: Date.now() + 3500_000,
                  email: connection?.email ?? null,
                  spreadsheetId: created.spreadsheetId,
                  spreadsheetUrl: created.spreadsheetUrl,
                  spreadsheetTitle: created.title,
                  sheetsAutoSync: connection?.sheetsAutoSync ?? true,
                  calendarId: connection?.calendarId ?? "primary",
                  calendarAutoSync: connection?.calendarAutoSync ?? true,
                };
                saveGoogleConnection(connection);
              }

              const spreadsheetId = connection.spreadsheetId;
              if (!spreadsheetId) return;

              await writeExpensesToSpreadsheet(
                accessToken,
                spreadsheetId,
                selected,
              );
              setMessage(
                connection.spreadsheetUrl
                  ? `تم التصدير إلى Google Sheets: ${connection.spreadsheetUrl}`
                  : "تم التصدير إلى Google Sheets",
              );
            })
          }
        />
        <ExportButton
          icon={<FileText className="h-4 w-4" />}
          title="PDF"
          subtitle="تقرير جاهز للطباعة أو الأرشفة"
          busy={busy === "pdf"}
          disabled={Boolean(busy) || selected.length === 0}
          onClick={() =>
            void run("pdf", () => {
              downloadExpensesPdf(selected, profile?.currency ?? "EGP");
            })
          }
        />
      </section>

      {message && (
        <p className="rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--accent)]">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      <details className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-7 text-[var(--muted-foreground)]">
        <summary className="cursor-pointer font-medium text-[var(--foreground)]">
          طريقة استخدام التصدير (بالتفصيل)
        </summary>
        <ol className="mt-3 list-decimal space-y-2 pe-5">
          <li>افتح تبويب «تصدير» من الإعدادات.</li>
          <li>
            اختر النطاق: كل المصروفات، أو اليوم/الأسبوع/الشهر، أو فترة من-إلى.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">Excel:</strong> اضغط الزر
            وسيُحمَّل ملف يفتح مباشرة في Microsoft Excel.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">PDF:</strong> اضغط للتقرير
            واحفظه أو اطبعه.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">Google Sheets:</strong> إن كان
            الربط مفعّلاً من تبويب Google Sheets، سيُكتب الجدول في حسابك. وإلا يُنزَّل
            ملف CSV ترفعه يدويًا من sheets.google.com ← ملف ← استيراد.
          </li>
        </ol>
      </details>

      {/* silent connect helper for first-time sheets export */}
      <button
        type="button"
        className="hidden"
        onClick={() => void connectGoogleSheets()}
        aria-hidden
      />
    </div>
  );
}

function ExportButton({
  icon,
  title,
  subtitle,
  onClick,
  disabled,
  busy,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-start gap-2 rounded-xl border border-[var(--border)] bg-white p-4 text-start shadow-[var(--shadow-sm)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
        {icon}
      </span>
      <span className="font-medium">{busy ? "جاري التصدير…" : title}</span>
      <span className="text-xs leading-5 text-[var(--muted-foreground)]">
        {subtitle}
      </span>
    </button>
  );
}
