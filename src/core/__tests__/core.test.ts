import { describe, expect, it } from "vitest";
import { resolveDateRange, isDateInRange, daysInRange } from "../date-range";
import { summarizeAnalytics, totalForExpenses } from "../analytics";
import { filterExpenses, withSequentialNumbers } from "../expense-filters";
import { formatMoney, parseAmountInput, sumAmounts } from "../money";
import type { Expense } from "../types";

function expense(partial: Partial<Expense> & Pick<Expense, "id" | "amount" | "itemName" | "spentOn">): Expense {
  return {
    userId: "user-1",
    notes: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    ...partial,
  };
}

describe("money", () => {
  it("sums amounts safely", () => {
    expect(sumAmounts([10.1, 20.2, 0.3])).toBe(30.6);
  });

  it("parses Arabic-friendly amount input", () => {
    expect(parseAmountInput("12.5")).toBe(12.5);
    expect(parseAmountInput("12,50")).toBe(12.5);
    expect(parseAmountInput("")).toBeNull();
    expect(parseAmountInput("0")).toBeNull();
    expect(parseAmountInput("abc")).toBeNull();
  });

  it("ignores empty amounts in totals", () => {
    expect(sumAmounts([10, null, 5, undefined])).toBe(15);
  });

  it("formats EGP in Arabic", () => {
    const formatted = formatMoney(1500.5, "EGP");
    expect(formatted).toContain("ج.م");
  });
});

describe("date-range", () => {
  const now = new Date(2026, 7, 27); // 27 Aug 2026

  it("resolves today", () => {
    expect(resolveDateRange("today", { now })).toEqual({
      preset: "today",
      from: "2026-08-27",
      to: "2026-08-27",
    });
  });

  it("resolves this month", () => {
    expect(resolveDateRange("this_month", { now })).toEqual({
      preset: "this_month",
      from: "2026-08-01",
      to: "2026-08-31",
    });
  });

  it("resolves last month", () => {
    expect(resolveDateRange("last_month", { now })).toEqual({
      preset: "last_month",
      from: "2026-07-01",
      to: "2026-07-31",
    });
  });

  it("normalizes inverted custom ranges", () => {
    expect(
      resolveDateRange("custom", { now, from: "2026-08-20", to: "2026-08-10" }),
    ).toEqual({
      preset: "custom",
      from: "2026-08-10",
      to: "2026-08-20",
    });
  });

  it("checks membership and day count", () => {
    const range = resolveDateRange("custom", {
      from: "2026-08-01",
      to: "2026-08-03",
    });
    expect(isDateInRange("2026-08-02", range)).toBe(true);
    expect(isDateInRange("2026-08-04", range)).toBe(false);
    expect(daysInRange(range)).toBe(3);
  });
});

describe("analytics & filters", () => {
  const rows = [
    expense({ id: "1", amount: 100, itemName: "قهوة", spentOn: "2026-08-27" }),
    expense({ id: "2", amount: 250, itemName: "خضار", spentOn: "2026-08-26", notes: "السوق" }),
    expense({ id: "3", amount: 50, itemName: "مواصلات", spentOn: "2026-08-27" }),
    expense({ id: "4", amount: 400, itemName: "إنترنت", spentOn: "2026-07-15" }),
  ];

  it("filters by search and date", () => {
    const result = filterExpenses(rows, { search: "سوق", from: "2026-08-01" });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("2");
  });

  it("assigns sequential numbers for visible rows", () => {
    const numbered = withSequentialNumbers(filterExpenses(rows, { spentOn: "2026-08-27" }));
    expect(numbered.map((r) => r.rowNumber)).toEqual([1, 2]);
  });

  it("computes footer totals", () => {
    expect(totalForExpenses(rows.filter((r) => r.spentOn === "2026-08-27"))).toEqual({
      count: 2,
      total: 150,
    });
  });

  it("summarizes analytics for a range", () => {
    const summary = summarizeAnalytics(rows, {
      preset: "custom",
      from: "2026-08-26",
      to: "2026-08-27",
    });

    expect(summary.totalSpent).toBe(400);
    expect(summary.purchaseCount).toBe(3);
    expect(summary.highestSpendingDay?.date).toBe("2026-08-26");
    expect(summary.highestSpendingDay?.total).toBe(250);
    expect(summary.topExpenses[0]?.itemName).toBe("خضار");
    expect(summary.dailySpending).toHaveLength(2);
  });
});

describe("calendar", () => {
  it("builds a 42-day month grid with daily totals", async () => {
    const { buildMonthGrid } = await import("../calendar");
    const grid = buildMonthGrid(2026, 7, [
      expense({ id: "1", amount: 100, itemName: "أ", spentOn: "2026-08-27" }),
      expense({ id: "2", amount: null, itemName: "", spentOn: "2026-08-27" }),
    ], "2026-08-27");

    expect(grid).toHaveLength(42);
    const day = grid.find((cell) => cell.date === "2026-08-27");
    expect(day?.count).toBe(2);
    expect(day?.total).toBe(100);
    expect(day?.isToday).toBe(true);
  });
});

describe("export", () => {
  it("filters export scope by custom range", async () => {
    const { selectExpensesForExport, toSheetMatrix } = await import("../export");
    const rows = [
      expense({ id: "1", amount: 10, itemName: "أ", spentOn: "2026-08-01" }),
      expense({ id: "2", amount: 20, itemName: "ب", spentOn: "2026-08-15" }),
      expense({ id: "3", amount: 30, itemName: "ج", spentOn: "2026-09-01" }),
    ];
    const selected = selectExpensesForExport(rows, {
      scope: "custom",
      from: "2026-08-01",
      to: "2026-08-31",
    });
    expect(selected.map((r) => r.id)).toEqual(["2", "1"]);
    expect(toSheetMatrix(selected)[0]?.[0]).toBe("التاريخ");
  });
});
