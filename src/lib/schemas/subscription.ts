import { z } from "zod";

export const SubscriptionInput = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url().optional().or(z.literal("")),
  cost: z.number().int().nonnegative().optional(),
  currency: z.string().min(1).default("USD"),
  cycle: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]).default("MONTHLY"),
  startDate: z.coerce.date().optional(),
  active: z.boolean().default(true),
  notes: z.string().optional().or(z.literal("")),
});

export type SubscriptionInput = z.infer<typeof SubscriptionInput>;
