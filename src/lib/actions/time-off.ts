"use server";

import { db } from "@/lib/db";
import { TimeOffRequestInput } from "@/lib/schemas/hr";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";
import { requireMembership } from "./_shared";
import type { TimeOffStatus } from "@prisma/client";

function diffDaysInclusive(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, days);
}

export async function listTimeOffRequests(status?: TimeOffStatus) {
  const { businessId } = await requireMembership();
  return db.timeOffRequest.findMany({
    where: { businessId, ...(status ? { status } : {}) },
    include: { employee: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTimeOffRequest(
  input: unknown,
): Promise<Result<{ id: string }>> {
  const { businessId } = await requireMembership();
  const parsed = TimeOffRequestInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  if (parsed.data.endDate < parsed.data.startDate) {
    return err("End date must be on or after start date");
  }
  const employee = await db.employee.findFirst({
    where: { id: parsed.data.employeeId, businessId },
  });
  if (!employee) return err("Employee not found");

  const days = diffDaysInclusive(parsed.data.startDate, parsed.data.endDate);

  try {
    const req = await db.timeOffRequest.create({
      data: {
        businessId,
        employeeId: parsed.data.employeeId,
        type: parsed.data.type,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        days,
        reason: parsed.data.reason || null,
      },
    });
    revalidatePath("/time-off");
    return ok({ id: req.id });
  } catch {
    return err("Failed to submit request");
  }
}

export async function decideTimeOffRequest(
  id: string,
  decision: "APPROVED" | "REJECTED",
): Promise<Result<null>> {
  const { businessId, userId } = await requireMembership();

  const req = await db.timeOffRequest.findFirst({ where: { id, businessId } });
  if (!req) return err("Not found");
  if (req.status !== "PENDING") return err("Already decided");

  await db.$transaction(async (tx) => {
    await tx.timeOffRequest.update({
      where: { id },
      data: { status: decision, decidedAt: new Date(), decidedById: userId },
    });
    if (decision === "APPROVED" && req.type === "VACATION") {
      await tx.employee.update({
        where: { id: req.employeeId },
        data: { ptoBalanceDays: { decrement: req.days } },
      });
    }
  });
  revalidatePath("/time-off");
  revalidatePath(`/employees/${req.employeeId}`);
  return ok(null);
}

export async function cancelTimeOffRequest(id: string): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  const req = await db.timeOffRequest.findFirst({ where: { id, businessId } });
  if (!req) return err("Not found");
  if (req.status !== "PENDING") return err("Only pending requests can be cancelled");
  await db.timeOffRequest.update({ where: { id }, data: { status: "CANCELLED" } });
  revalidatePath("/time-off");
  return ok(null);
}
