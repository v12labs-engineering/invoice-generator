"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BusinessProfileInput } from "@/lib/schemas/business-profile";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";

export async function getBusinessProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.businessProfile.findUnique({ where: { userId: session.user.id } });
}

export async function upsertBusinessProfile(input: unknown): Promise<Result<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return err("Unauthenticated");

  const parsed = BusinessProfileInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  const profile = await db.businessProfile.upsert({
    where: { userId: session.user.id },
    create: { ...parsed.data, userId: session.user.id },
    update: parsed.data,
  });

  revalidatePath("/settings");
  return ok({ id: profile.id });
}
