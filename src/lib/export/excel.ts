import * as XLSX from "xlsx";
import type { Expense } from "@/core/types";
import { exportFilename, toSheetMatrix } from "@/core/export";

export function downloadExpensesExcel(expenses: Expense[]): void {
  const matrix = toSheetMatrix(expenses);
  const sheet = XLSX.utils.aoa_to_sheet(matrix);
  sheet["!cols"] = [
    { wch: 14 },
    { wch: 12 },
    { wch: 28 },
    { wch: 32 },
    { wch: 36 },
  ];

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "المصروفات");
  XLSX.writeFile(book, exportFilename("masroofy-expenses", "xlsx"));
}

export function downloadExpensesCsv(expenses: Expense[]): void {
  const matrix = toSheetMatrix(expenses);
  const sheet = XLSX.utils.aoa_to_sheet(matrix);
  const csv = XLSX.utils.sheet_to_csv(sheet);
  // BOM for Excel/Sheets Arabic
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = exportFilename("masroofy-expenses", "csv");
  anchor.click();
  URL.revokeObjectURL(url);
}
