import { z } from "zod";

export const BusinessProfileInput = z.object({
  name: z.string().min(1),
  addressLines: z.array(z.string()).default([]),
  email: z.string().email(),
  phone: z.string().optional().or(z.literal("")),
  taxId: z.string().optional().or(z.literal("")),
  bankDetails: z.string().optional().or(z.literal("")),
  defaultCurrency: z.string().length(3),
  defaultTaxRate: z.number().int().min(0).max(10000),
  invoicePrefix: z.string().default("INV-"),
});

export type BusinessProfileInput = z.infer<typeof BusinessProfileInput>;
