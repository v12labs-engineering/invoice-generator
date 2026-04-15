import { z } from "zod";

export const ClientInput = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  addressLines: z.array(z.string()).default([]),
  taxId: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type ClientInput = z.infer<typeof ClientInput>;
