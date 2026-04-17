import { z } from "zod";

export const SubscriptionInput = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url().optional().or(z.literal("")),
  cost: z.number().int().nonnegative().optional(),
  cycle: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]).default("MONTHLY"),
  notes: z.string().optional().or(z.literal("")),
});

export type SubscriptionInput = z.infer<typeof SubscriptionInput>;
