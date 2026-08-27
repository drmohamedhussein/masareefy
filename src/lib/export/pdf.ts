import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Expense } from "@/core/types";
import { exportFilename, toExportRows } from "@/core/export";
import { formatMoney, sumAmounts } from "@/core/money";
import type { CurrencyCode } from "@/core/types";

/**
 * PDF export uses Latin digits for reliable built-in fonts.
 * Arabic labels are kept short; item names may render as transliteration-safe text.
 */
export function downloadExpensesPdf(
  expenses: Expense[],
  currency: CurrencyCode = "EGP",
): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const rows = toExportRows(expenses);
  const total = sumAmounts(expenses.map((e) => e.amount));

  doc.setFontSize(16);
  doc.text("Masareefy - Expenses Report", 40, 40);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString("en-GB")}`, 40, 58);
  doc.text(`Count: ${expenses.length}`, 40, 74);
  doc.text(`Total: ${formatMoney(total, currency)}`, 40, 90);

  autoTable(doc, {
    startY: 110,
    head: [["Date", "Amount", "Item", "Tags", "Notes"]],
    body: rows.map((row) => [
      row.spentOn,
      row.amount || "-",
      row.itemName || "-",
      row.tags || "-",
      row.notes || "-",
    ]),
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [47, 111, 237] },
    alternateRowStyles: { fillColor: [247, 247, 245] },
  });

  doc.save(exportFilename("Masareefy-expenses", "pdf"));
}
