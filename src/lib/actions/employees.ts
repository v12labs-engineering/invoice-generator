"use server";

import { db } from "@/lib/db";
import { EmployeeInput, OnboardingTaskInput } from "@/lib/schemas/hr";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";
import { requireMembership } from "./_shared";

const DEFAULT_ONBOARDING = [
  "Send offer letter",
  "Collect signed contract",
  "Provision email & SSO",
  "Issue laptop",
  "Add to payroll",
  "Schedule intro meetings",
  "Share handbook & policies",
];

function normalize(input: ReturnType<typeof EmployeeInput.parse>) {
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone || null,
    title: input.title || null,
    department: input.department || null,
    employmentType: input.employmentType,
    status: input.status,
    startDate: input.startDate,
    endDate: input.endDate,
    salaryAmount: input.salaryAmount,
    salaryCurrency: input.salaryCurrency,
    ptoBalanceDays: input.ptoBalanceDays,
    managerId: input.managerId || null,
    notes: input.notes || null,
  };
}

export async function listEmployees() {
  const { businessId } = await requireMembership();
  return db.employee.findMany({
    where: { businessId },
    include: { manager: true },
    orderBy: [{ status: "asc" }, { firstName: "asc" }],
  });
}

export async function getEmployee(id: string) {
  const { businessId } = await requireMembership();
  return db.employee.findFirst({
    where: { id, businessId },
    include: {
      manager: true,
      reports: true,
      onboardingTasks: { orderBy: [{ completedAt: "asc" }, { sortOrder: "asc" }] },
      timeOffRequests: { orderBy: { startDate: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function createEmployee(input: unknown): Promise<Result<{ id: string }>> {
  const { businessId } = await requireMembership();
  const parsed = EmployeeInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  try {
    const employee = await db.employee.create({
      data: {
        ...normalize(parsed.data),
        businessId,
        onboardingTasks: {
          create: DEFAULT_ONBOARDING.map((title, i) => ({ title, sortOrder: i })),
        },
      },
    });
    revalidatePath("/employees");
    return ok({ id: employee.id });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique")) {
      return err("Email already used for another employee");
    }
    return err("Failed to create employee");
  }
}

export async function updateEmployee(id: string, input: unknown): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  const parsed = EmployeeInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  const result = await db.employee.updateMany({
    where: { id, businessId },
    data: normalize(parsed.data),
  });
  if (result.count === 0) return err("Not found");
  revalidatePath(`/employees/${id}`);
  revalidatePath("/employees");
  return ok(null);
}

export async function terminateEmployee(id: string): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  const result = await db.employee.updateMany({
    where: { id, businessId },
    data: { status: "TERMINATED", endDate: new Date() },
  });
  if (result.count === 0) return err("Not found");
  revalidatePath("/employees");
  return ok(null);
}

export async function toggleOnboardingTask(
  taskId: string,
): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  const task = await db.onboardingTask.findFirst({
    where: { id: taskId, employee: { businessId } },
  });
  if (!task) return err("Not found");
  await db.onboardingTask.update({
    where: { id: taskId },
    data: { completedAt: task.completedAt ? null : new Date() },
  });

  // If all tasks complete, flip employee status to ACTIVE.
  const remaining = await db.onboardingTask.count({
    where: { employeeId: task.employeeId, completedAt: null },
  });
  if (remaining === 0) {
    await db.employee.update({
      where: { id: task.employeeId },
      data: { status: "ACTIVE" },
    });
  }

  revalidatePath(`/employees/${task.employeeId}`);
  return ok(null);
}

export async function addOnboardingTask(input: unknown): Promise<Result<{ id: string }>> {
  const { businessId } = await requireMembership();
  const parsed = OnboardingTaskInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  const employee = await db.employee.findFirst({
    where: { id: parsed.data.employeeId, businessId },
  });
  if (!employee) return err("Employee not found");

  const count = await db.onboardingTask.count({ where: { employeeId: employee.id } });
  const task = await db.onboardingTask.create({
    data: {
      employeeId: employee.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      sortOrder: count,
    },
  });
  revalidatePath(`/employees/${employee.id}`);
  return ok({ id: task.id });
}

export async function deleteOnboardingTask(taskId: string): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  const task = await db.onboardingTask.findFirst({
    where: { id: taskId, employee: { businessId } },
  });
  if (!task) return err("Not found");
  await db.onboardingTask.delete({ where: { id: taskId } });
  revalidatePath(`/employees/${task.employeeId}`);
  return ok(null);
}
