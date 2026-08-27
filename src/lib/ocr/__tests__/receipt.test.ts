import { describe, expect, it } from "vitest";
import { parseReceiptText } from "@/lib/ocr/receipt";

describe("receipt OCR parse", () => {
  it("extracts total amount and item name", () => {
    const result = parseReceiptText("Coffee Shop\nLatte\nTotal 45.50 EGP");
    expect(result.amount).toBe(45.5);
    expect(result.itemName.length).toBeGreaterThan(0);
  });
});
