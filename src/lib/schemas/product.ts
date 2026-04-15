import { z } from "zod";

export const ProductInput = z.object({
  name: z.string().min(1),
  description: z.string().optional().or(z.literal("")),
  unitPrice: z.number().int().nonnegative(),
  currency: z.string().length(3),
  defaultTaxRate: z.number().int().min(0).max(10000),
});

export type ProductInput = z.infer<typeof ProductInput>;
