"use server";

import { requireUserId } from "./_shared";
import { db } from "@/lib/db";
import { BusinessProfileInput } from "@/lib/schemas/business-profile";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";

export async function getBusinessProfile() {
  try {
    const userId = await requireUserId();
    return db.businessProfile.findUnique({ where: { userId } });
  } catch {
    return null;
  }
}

export async function upsertBusinessProfile(input: unknown): Promise<Result<{ id: string }>> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return err("Unauthenticated");
  }

  const parsed = BusinessProfileInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  const profile = await db.businessProfile.upsert({
    where: { userId },
    create: { ...parsed.data, userId },
    update: parsed.data,
  });

  revalidatePath("/settings");
  return ok({ id: profile.id });
}
