import { z } from "zod";
import { InvoiceLineInput } from "./invoice";

export const RecurringInput = z.object({
  clientId: z.string().min(1),
  cadence: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  intervalCount: z.number().int().positive().default(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  autoSend: z.boolean().default(false),
  currency: z.string().length(3),
  terms: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  lines: z.array(InvoiceLineInput).min(1),
});

export type RecurringInput = z.infer<typeof RecurringInput>;
