"use server";

import { db } from "@/lib/db";
import { DealInput, DealStageEnum } from "@/lib/schemas/crm";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";
import { requireMembership } from "./_shared";

function normalize(input: ReturnType<typeof DealInput.parse>) {
  return {
    title: input.title,
    stage: input.stage,
    clientId: input.clientId || null,
    contactId: input.contactId || null,
    value: input.value,
    currency: input.currency,
    probability: input.probability,
    expectedAt: input.expectedAt,
    notes: input.notes || null,
  };
}

export async function listDeals() {
  const { businessId } = await requireMembership();
  return db.deal.findMany({
    where: { businessId },
    include: { client: true, contact: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDeal(id: string) {
  const { businessId } = await requireMembership();
  return db.deal.findFirst({
    where: { id, businessId },
    include: { client: true, contact: true, quotes: true },
  });
}

export async function createDeal(input: unknown): Promise<Result<{ id: string }>> {
  const { businessId } = await requireMembership();
  const parsed = DealInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  try {
    const deal = await db.deal.create({
      data: { ...normalize(parsed.data), businessId },
    });
    revalidatePath("/deals");
    return ok({ id: deal.id });
  } catch {
    return err("Failed to create deal");
  }
}

export async function updateDeal(id: string, input: unknown): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  const parsed = DealInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  const result = await db.deal.updateMany({
    where: { id, businessId },
    data: normalize(parsed.data),
  });
  if (result.count === 0) return err("Not found");
  revalidatePath("/deals");
  revalidatePath(`/deals/${id}`);
  return ok(null);
}

export async function moveDealStage(id: string, stage: string): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  const parsed = DealStageEnum.safeParse(stage);
  if (!parsed.success) return err("Invalid stage");

  const data: { stage: typeof parsed.data; closedAt?: Date | null } = { stage: parsed.data };
  if (parsed.data === "WON" || parsed.data === "LOST") data.closedAt = new Date();
  else data.closedAt = null;

  const result = await db.deal.updateMany({ where: { id, businessId }, data });
  if (result.count === 0) return err("Not found");
  revalidatePath("/deals");
  return ok(null);
}

export async function deleteDeal(id: string): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  const result = await db.deal.deleteMany({ where: { id, businessId } });
  if (result.count === 0) return err("Not found");
  revalidatePath("/deals");
  return ok(null);
}
