"use server";

import { db } from "@/lib/db";
import { SubscriptionInput } from "@/lib/schemas/subscription";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";
import { requireMembership } from "./_shared";

export async function listSubscriptions() {
  const { businessId } = await requireMembership();
  return db.subscription.findMany({
    where: { businessId, archivedAt: null },
    orderBy: { name: "asc" },
  });
}

export async function createSubscription(input: unknown): Promise<Result<{ id: string }>> {
  const { businessId } = await requireMembership();
  const parsed = SubscriptionInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  const startDate = parsed.data.startDate ?? new Date();

  try {
    const subscription = await db.subscription.create({
      data: {
        businessId,
        name: parsed.data.name,
        url: parsed.data.url || null,
        cost: parsed.data.cost ?? null,
        currency: parsed.data.currency,
        cycle: parsed.data.cycle,
        startDate,
        nextRunAt: parsed.data.cost ? startDate : null,
        active: parsed.data.active,
        notes: parsed.data.notes || null,
      },
    });
    revalidatePath("/subscriptions");
    revalidatePath("/expenses");
    return ok({ id: subscription.id });
  } catch {
    return err("Failed to create subscription");
  }
}

export async function updateSubscription(id: string, input: unknown): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  const parsed = SubscriptionInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  try {
    const result = await db.subscription.updateMany({
      where: { id, businessId },
      data: {
        name: parsed.data.name,
        url: parsed.data.url || null,
        cost: parsed.data.cost ?? null,
        currency: parsed.data.currency,
        cycle: parsed.data.cycle,
        notes: parsed.data.notes || null,
      },
    });
    if (result.count === 0) return err("Not found");
    revalidatePath("/subscriptions");
    revalidatePath("/expenses");
    return ok(null);
  } catch {
    return err("Failed to update subscription");
  }
}

export async function toggleSubscription(id: string): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  const sub = await db.subscription.findFirst({ where: { id, businessId } });
  if (!sub) return err("Not found");

  await db.subscription.update({
    where: { id },
    data: { active: !sub.active },
  });
  revalidatePath("/subscriptions");
  return ok(null);
}

export async function archiveSubscription(id: string): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  try {
    const result = await db.subscription.updateMany({
      where: { id, businessId },
      data: { archivedAt: new Date(), active: false },
    });
    if (result.count === 0) return err("Not found");
    revalidatePath("/subscriptions");
    return ok(null);
  } catch {
    return err("Failed to archive subscription");
  }
}
