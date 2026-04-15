import { describe, it, expect } from "vitest";
import {
  calcLineTotal,
  calcInvoiceTotals,
  formatMoney,
} from "@/lib/money";

describe("calcLineTotal", () => {
  it("multiplies quantity by unit price", () => {
    expect(calcLineTotal({ quantity: 3, unitPrice: 1000, lineDiscount: 0, taxRate: 0 }))
      .toEqual({ subtotal: 3000, discount: 0, tax: 0, total: 3000 });
  });

  it("applies line discount before tax", () => {
    expect(calcLineTotal({ quantity: 2, unitPrice: 1000, lineDiscount: 200, taxRate: 1000 }))
      .toEqual({ subtotal: 2000, discount: 200, tax: 180, total: 1980 });
  });

  it("rounds tax half-up to nearest cent", () => {
    expect(calcLineTotal({ quantity: 1, unitPrice: 333, lineDiscount: 0, taxRate: 1000 }).tax).toBe(33);
    expect(calcLineTotal({ quantity: 1, unitPrice: 335, lineDiscount: 0, taxRate: 1000 }).tax).toBe(34);
  });
});

describe("calcInvoiceTotals", () => {
  it("sums line subtotals, discounts, taxes", () => {
    const lines = [
      { quantity: 2, unitPrice: 1000, lineDiscount: 0, taxRate: 1000 },
      { quantity: 1, unitPrice: 500, lineDiscount: 50, taxRate: 0 },
    ];
    const result = calcInvoiceTotals(lines, 0);
    expect(result.subtotal).toBe(2500);
    expect(result.discountAmount).toBe(50);
    expect(result.taxAmount).toBe(200);
    expect(result.total).toBe(2650);
  });

  it("applies global discount proportionally before tax recomputation", () => {
    const lines = [{ quantity: 1, unitPrice: 10000, lineDiscount: 0, taxRate: 1000 }];
    const result = calcInvoiceTotals(lines, 1000);
    expect(result.subtotal).toBe(10000);
    expect(result.discountAmount).toBe(1000);
    expect(result.taxAmount).toBe(900);
    expect(result.total).toBe(9900);
  });
});

describe("formatMoney", () => {
  it("formats cents with USD symbol", () => {
    expect(formatMoney(123456, "USD")).toBe("$1,234.56");
  });

  it("formats EUR with euro sign", () => {
    expect(formatMoney(1000, "EUR")).toMatch(/€/);
  });
});
