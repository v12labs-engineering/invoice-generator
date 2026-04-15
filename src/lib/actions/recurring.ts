"use server";

import { db } from "@/lib/db";
import { RecurringInput } from "@/lib/schemas/recurring";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";
import { requireUserId } from "./_shared";

export async function listSchedules() {
  const userId = await requireUserId();
  return db.recurringSchedule.findMany({
    where: { userId },
    include: { client: true },
    orderBy: { nextRunAt: "asc" },
  });
}

export async function createSchedule(input: unknown): Promise<Result<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = RecurringInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  try {
    const sched = await db.recurringSchedule.create({
      data: {
        userId,
        clientId: parsed.data.clientId,
        cadence: parsed.data.cadence,
        intervalCount: parsed.data.intervalCount,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate ?? null,
        nextRunAt: parsed.data.startDate,
        autoSend: parsed.data.autoSend,
        templateJson: {
          currency: parsed.data.currency,
          notes: parsed.data.notes ?? "",
          terms: parsed.data.terms ?? "",
          lines: parsed.data.lines,
        },
      },
    });
    revalidatePath("/recurring");
    return ok({ id: sched.id });
  } catch {
    return err("Failed to create schedule");
  }
}

export async function toggleSchedule(id: string, active: boolean): Promise<Result<null>> {
  const userId = await requireUserId();
  const result = await db.recurringSchedule.updateMany({
    where: { id, userId },
    data: { active },
  });
  if (result.count === 0) return err("Not found");
  revalidatePath("/recurring");
  return ok(null);
}
