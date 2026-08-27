/**
 * استخراج تقريبي للسعر واسم الصنف من نص فاتورة (OCR).
 * يفضّل أكبر رقم عشري معقول كسعر، وأول سطر نصي كاسم.
 */

export interface ReceiptParseResult {
  amount: number | null;
  itemName: string;
  notes: string;
  rawText: string;
}

function normalizeArabicDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
}

export function parseReceiptText(raw: string): ReceiptParseResult {
  const text = normalizeArabicDigits(raw || "").trim();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const scored: Array<{ value: number; score: number }> = [];
  const amountRegex =
    /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/g;
  for (const line of lines) {
    const lower = line.toLowerCase();
    const looksLikeTotal =
      /total|المجموع|الإجمالي|اجمالي|المبلغ|ج\.?م|egp|le\b|جنيه/i.test(lower);
    let match: RegExpExecArray | null;
    const re = new RegExp(amountRegex.source, "g");
    while ((match = re.exec(line)) != null) {
      const normalized = match[1]!
        .replace(/,/g, "")
        .replace(/(\d)\.(\d{3})\b/g, "$1$2");
      const value = Number(normalized.replace(",", "."));
      if (!Number.isFinite(value) || value <= 0 || value > 1_000_000) continue;
      scored.push({ value, score: looksLikeTotal ? 2 : 1 });
    }
  }

  scored.sort((a, b) => b.score - a.score || b.value - a.value);
  const amount = scored[0]?.value ?? null;

  const nameLine =
    lines.find((line) => {
      const digitsOnly = line.replace(/[\d\s.,:\-/\\]+/g, "");
      return digitsOnly.length >= 2 && !/total|المجموع|الإجمالي/i.test(line);
    }) ?? "";

  return {
    amount: amount != null && amount > 1_000_000 ? null : amount,
    itemName: nameLine.slice(0, 80),
    notes: "من صورة فاتورة",
    rawText: text,
  };
}

export async function recognizeReceiptImage(
  file: File,
): Promise<ReceiptParseResult> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng+ara");
  try {
    const {
      data: { text },
    } = await worker.recognize(file);
    return parseReceiptText(text);
  } finally {
    await worker.terminate();
  }
}
