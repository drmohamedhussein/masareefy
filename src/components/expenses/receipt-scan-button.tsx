"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { recognizeReceiptImage } from "@/lib/ocr/receipt";
import { useExpenses } from "@/components/expenses/expenses-provider";

export function ReceiptScanButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { addExpense, selectedDate } = useExpenses();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          void (async () => {
            setBusy(true);
            setError(null);
            try {
              const parsed = await recognizeReceiptImage(file);
              await addExpense({
                amount: parsed.amount,
                itemName: parsed.itemName || "فاتورة",
                tags: ["تسوق"],
                notes: parsed.notes,
                spentOn: selectedDate,
              });
            } catch {
              setError("تعذر قراءة الفاتورة. جرّب صورة أوضح.");
            } finally {
              setBusy(false);
            }
          })();
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--foreground)] shadow-[var(--shadow-sm)] hover:bg-[var(--hover)] disabled:opacity-60"
        title="تصوير فاتورة"
      >
        <Camera className="h-4 w-4" />
        {busy ? "جاري القراءة…" : "فاتورة"}
      </button>
      {error && (
        <span className="w-full text-xs text-[var(--danger)] sm:w-auto">{error}</span>
      )}
    </>
  );
}
