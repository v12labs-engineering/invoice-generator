import { z } from "zod";

export const SubscriptionInput = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  addressLines: z.array(z.string()).default([]),
  notes: z.string().optional().or(z.literal("")),
});

export type SubscriptionInput = z.infer<typeof SubscriptionInput>;
