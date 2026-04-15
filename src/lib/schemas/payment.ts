import { z } from "zod";

export const PaymentInput = z.object({
  invoiceId: z.string(),
  amount: z.number().int().positive(),
  paidAt: z.coerce.date(),
  method: z.enum(["bank", "card", "cash", "other"]),
  reference: z.string().optional().or(z.literal("")),
  note: z.string().optional().or(z.literal("")),
});

export type PaymentInput = z.infer<typeof PaymentInput>;
