export type LineInput = {
  quantity: number;
  unitPrice: number;
  lineDiscount: number;
  taxRate: number; // basis points (1% = 100)
};

export type LineTotals = {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
};

export type InvoiceTotals = {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
};

const roundHalfUp = (n: number): number => Math.floor(n + 0.5);

export const calcLineTotal = (line: LineInput): LineTotals => {
  const subtotal = line.quantity * line.unitPrice;
  const afterDiscount = Math.max(0, subtotal - line.lineDiscount);
  const tax = roundHalfUp((afterDiscount * line.taxRate) / 10000);
  return {
    subtotal,
    discount: line.lineDiscount,
    tax,
    total: afterDiscount + tax,
  };
};

export const calcInvoiceTotals = (lines: LineInput[], globalDiscount: number): InvoiceTotals => {
  let subtotal = 0;
  let lineDiscounts = 0;
  for (const line of lines) {
    subtotal += line.quantity * line.unitPrice;
    lineDiscounts += line.lineDiscount;
  }

  const discountedBase = Math.max(0, subtotal - lineDiscounts);
  const preTaxTotal = Math.max(0, discountedBase - globalDiscount);
  const scale = discountedBase > 0 ? preTaxTotal / discountedBase : 0;

  let taxAmount = 0;
  for (const line of lines) {
    const lineBase = (line.quantity * line.unitPrice - line.lineDiscount) * scale;
    taxAmount += roundHalfUp((lineBase * line.taxRate) / 10000);
  }

  const effectiveDiscount = subtotal - preTaxTotal;
  return {
    subtotal,
    discountAmount: effectiveDiscount,
    taxAmount,
    total: preTaxTotal + taxAmount,
  };
};

export const formatMoney = (cents: number, currency: string): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
