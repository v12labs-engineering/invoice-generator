import { z } from "zod";

export const DealStageEnum = z.enum([
  "LEAD",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
]);
export type DealStageEnum = z.infer<typeof DealStageEnum>;

export const QuoteStatusEnum = z.enum([
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
]);
export type QuoteStatusEnum = z.infer<typeof QuoteStatusEnum>;

const optInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z.number().int().nullable(),
);

const optDate = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : new Date(String(v))),
  z.date().nullable(),
);

const optStr = (schema: z.ZodString = z.string()) =>
  schema.optional().or(z.literal(""));

export const ContactInput = z.object({
  name: z.string().min(1, "Name is required"),
  email: optStr(z.string().email()),
  phone: optStr(),
  title: optStr(),
  clientId: optStr(),
  notes: optStr(),
});
export type ContactInput = z.infer<typeof ContactInput>;

export const DealInput = z.object({
  title: z.string().min(1, "Title is required"),
  stage: DealStageEnum.default("LEAD"),
  clientId: optStr(),
  contactId: optStr(),
  value: optInt,
  currency: z.string().length(3).default("USD"),
  probability: z
    .preprocess((v) => (v === "" || v === null || v === undefined ? 0 : Number(v)), z.number().int().min(0).max(100))
    .default(0),
  expectedAt: optDate,
  notes: optStr(),
});
export type DealInput = z.infer<typeof DealInput>;

export const QuoteLineInput = z.object({
  description: z.string().min(1),
  quantity: z.preprocess((v) => Number(v), z.number().int().positive()),
  unitPrice: z.preprocess((v) => Number(v), z.number().int().nonnegative()),
  lineDiscount: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().int().nonnegative()).default(0),
  taxRate: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().int().nonnegative()).default(0),
  sortOrder: z.preprocess((v) => Number(v), z.number().int().nonnegative()),
  productId: optStr(),
});
export type QuoteLineInput = z.infer<typeof QuoteLineInput>;

export const QuoteInput = z.object({
  clientId: z.string().min(1, "Client is required"),
  dealId: optStr(),
  issueDate: z.preprocess((v) => new Date(String(v)), z.date()),
  expiryDate: optDate,
  currency: z.string().length(3),
  notes: optStr(),
  terms: optStr(),
  globalDiscount: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().int().nonnegative()).default(0),
  lines: z.array(QuoteLineInput).min(1, "Add at least one line"),
});
export type QuoteInput = z.infer<typeof QuoteInput>;
