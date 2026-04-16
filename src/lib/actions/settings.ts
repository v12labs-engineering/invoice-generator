"use server";

import { requireMembership } from "./_shared";
import { db } from "@/lib/db";
import { BusinessProfileInput } from "@/lib/schemas/business-profile";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";

/** Current active business (the one selected via cookie, defaulting to first membership). */
export async function getBusinessProfile() {
  try {
    const { businessId } = await requireMembership();
    return db.business.findUnique({ where: { id: businessId } });
  } catch {
    return null;
  }
}

/** Update the active business. OWNER-only. */
export async function upsertBusinessProfile(input: unknown): Promise<Result<{ id: string }>> {
  let businessId: string;
  try {
    const m = await requireMembership("OWNER");
    businessId = m.businessId;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Unauthenticated");
  }

  const parsed = BusinessProfileInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  const business = await db.business.update({
    where: { id: businessId },
    data: parsed.data,
  });

  revalidatePath("/settings");
  return ok({ id: business.id });
}
