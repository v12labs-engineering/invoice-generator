import { z } from "zod";

export const InvoiceLineInput = z.object({
  productId: z.string().optional().nullable(),
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative(),
  lineDiscount: z.number().int().nonnegative().default(0),
  taxRate: z.number().int().min(0).max(10000).default(0),
  sortOrder: z.number().int().nonnegative(),
});

export const InvoiceInput = z.object({
  clientId: z.string().min(1),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  currency: z.string().length(3),
  notes: z.string().optional().or(z.literal("")),
  terms: z.string().optional().or(z.literal("")),
  globalDiscount: z.number().int().nonnegative().default(0),
  lines: z.array(InvoiceLineInput).min(1, "At least one line required"),
});

export type InvoiceInput = z.infer<typeof InvoiceInput>;
export type InvoiceLineInput = z.infer<typeof InvoiceLineInput>;
