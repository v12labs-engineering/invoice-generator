import { z } from "zod";

export const ProjectStatusEnum = z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]);
export type ProjectStatusEnum = z.infer<typeof ProjectStatusEnum>;

const optInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z.number().int().nonnegative().nullable(),
);

const optDate = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : new Date(String(v))),
  z.date().nullable(),
);

export const ProjectInput = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().or(z.literal("")),
  clientId: z.string().optional().or(z.literal("")),
  status: ProjectStatusEnum.default("ACTIVE"),
  hourlyRate: optInt,
  currency: z.string().length(3).default("USD"),
  budgetAmount: optInt,
  budgetHours: optInt,
  startDate: optDate,
  endDate: optDate,
});

export type ProjectInput = z.infer<typeof ProjectInput>;

export const TimeEntryInput = z.object({
  projectId: z.string().min(1),
  date: z.preprocess((v) => new Date(String(v)), z.date()),
  minutes: z.preprocess((v) => Number(v), z.number().int().positive("Minutes must be > 0")),
  description: z.string().min(1, "Description is required"),
  billable: z.preprocess(
    (v) => v === "on" || v === true || v === "true",
    z.boolean(),
  ),
  hourlyRate: optInt,
});

export type TimeEntryInput = z.infer<typeof TimeEntryInput>;
