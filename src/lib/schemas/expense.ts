import { z } from "zod";

export const ExpenseInput = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().int().positive("Amount must be positive"),
  date: z.coerce.date(),
  categoryId: z.string().min(1, "Category is required"),
  subscriptionId: z.string().optional().or(z.literal("")),
  currency: z.string().default("INR"),
  paymentMethod: z.string().optional().or(z.literal("")),
  reference: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type ExpenseInput = z.infer<typeof ExpenseInput>;
