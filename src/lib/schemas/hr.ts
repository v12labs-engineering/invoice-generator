import { z } from "zod";

export const EmploymentTypeEnum = z.enum([
  "FULL_TIME",
  "PART_TIME",
  "CONTRACTOR",
  "INTERN",
]);
export type EmploymentTypeEnum = z.infer<typeof EmploymentTypeEnum>;

export const EmployeeStatusEnum = z.enum([
  "ACTIVE",
  "ONBOARDING",
  "ON_LEAVE",
  "TERMINATED",
]);
export type EmployeeStatusEnum = z.infer<typeof EmployeeStatusEnum>;

export const TimeOffTypeEnum = z.enum([
  "VACATION",
  "SICK",
  "PERSONAL",
  "UNPAID",
  "OTHER",
]);
export type TimeOffTypeEnum = z.infer<typeof TimeOffTypeEnum>;

export const TimeOffStatusEnum = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
]);
export type TimeOffStatusEnum = z.infer<typeof TimeOffStatusEnum>;

export const DocumentCategoryEnum = z.enum([
  "CONTRACT",
  "POLICY",
  "TAX",
  "ID",
  "OTHER",
]);
export type DocumentCategoryEnum = z.infer<typeof DocumentCategoryEnum>;

const optInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z.number().int().nullable(),
);
const optDate = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : new Date(String(v))),
  z.date().nullable(),
);
const optStr = (s: z.ZodString = z.string()) => s.optional().or(z.literal(""));

export const EmployeeInput = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email required"),
  phone: optStr(),
  title: optStr(),
  department: optStr(),
  employmentType: EmploymentTypeEnum.default("FULL_TIME"),
  status: EmployeeStatusEnum.default("ONBOARDING"),
  startDate: z.preprocess((v) => new Date(String(v)), z.date()),
  endDate: optDate,
  salaryAmount: optInt,
  salaryCurrency: z.string().length(3).default("USD"),
  ptoBalanceDays: z
    .preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().int().min(0))
    .default(0),
  managerId: optStr(),
  notes: optStr(),
});
export type EmployeeInput = z.infer<typeof EmployeeInput>;

export const OnboardingTaskInput = z.object({
  employeeId: z.string().min(1),
  title: z.string().min(1),
  description: optStr(),
});
export type OnboardingTaskInput = z.infer<typeof OnboardingTaskInput>;

export const TimeOffRequestInput = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  type: TimeOffTypeEnum.default("VACATION"),
  startDate: z.preprocess((v) => new Date(String(v)), z.date()),
  endDate: z.preprocess((v) => new Date(String(v)), z.date()),
  reason: optStr(),
});
export type TimeOffRequestInput = z.infer<typeof TimeOffRequestInput>;

export const DocumentUploadInput = z.object({
  title: z.string().min(1),
  category: DocumentCategoryEnum.default("OTHER"),
  employeeId: optStr(),
  notes: optStr(),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  fileType: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
});
export type DocumentUploadInput = z.infer<typeof DocumentUploadInput>;
