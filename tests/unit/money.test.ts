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

describe("edge cases", () => {
  it("clamps line discount that exceeds line subtotal to zero", () => {
    expect(calcLineTotal({ quantity: 1, unitPrice: 1000, lineDiscount: 5000, taxRate: 1000 }))
      .toEqual({ subtotal: 1000, discount: 5000, tax: 0, total: 0 });
  });

  it("returns zeros for empty line array", () => {
    expect(calcInvoiceTotals([], 0))
      .toEqual({ subtotal: 0, discountAmount: 0, taxAmount: 0, total: 0 });
  });

  it("clamps global discount that exceeds subtotal", () => {
    const lines = [{ quantity: 1, unitPrice: 1000, lineDiscount: 0, taxRate: 1000 }];
    const result = calcInvoiceTotals(lines, 5000);
    expect(result.subtotal).toBe(1000);
    expect(result.discountAmount).toBe(1000);
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(0);
  });

  it("100% global discount yields zero tax and total", () => {
    const lines = [{ quantity: 2, unitPrice: 5000, lineDiscount: 0, taxRate: 2000 }];
    const result = calcInvoiceTotals(lines, 10000);
    expect(result.total).toBe(0);
    expect(result.taxAmount).toBe(0);
  });

  it("scales tax proportionally across mixed-rate lines under global discount", () => {
    const lines = [
      { quantity: 1, unitPrice: 10000, lineDiscount: 0, taxRate: 1000 }, // 10%
      { quantity: 1, unitPrice: 10000, lineDiscount: 0, taxRate: 2000 }, // 20%
    ];
    // discountedBase = 20000, globalDiscount = 4000 → preTax = 16000, scale = 0.8
    // Line 1: 10000 * 0.8 = 8000 base * 10% = 800
    // Line 2: 10000 * 0.8 = 8000 base * 20% = 1600
    const result = calcInvoiceTotals(lines, 4000);
    expect(result.subtotal).toBe(20000);
    expect(result.discountAmount).toBe(4000);
    expect(result.taxAmount).toBe(2400);
    expect(result.total).toBe(18400);
  });
});
