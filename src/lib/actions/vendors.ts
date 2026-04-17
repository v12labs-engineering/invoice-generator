"use server";

import { db } from "@/lib/db";
import { VendorInput } from "@/lib/schemas/vendor";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";
import { requireMembership } from "./_shared";

export async function listVendors() {
  const { businessId } = await requireMembership();
  return db.vendor.findMany({
    where: { businessId, archivedAt: null },
    orderBy: { name: "asc" },
  });
}

export async function createVendor(input: unknown): Promise<Result<{ id: string }>> {
  const { businessId } = await requireMembership();
  const parsed = VendorInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  try {
    const vendor = await db.vendor.create({
      data: { ...parsed.data, businessId, email: parsed.data.email || null },
    });
    revalidatePath("/vendors");
    revalidatePath("/expenses");
    return ok({ id: vendor.id });
  } catch {
    return err("Failed to create vendor");
  }
}

export async function updateVendor(id: string, input: unknown): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  const parsed = VendorInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  try {
    const result = await db.vendor.updateMany({
      where: { id, businessId },
      data: { ...parsed.data, email: parsed.data.email || null },
    });
    if (result.count === 0) return err("Not found");
    revalidatePath("/vendors");
    revalidatePath("/expenses");
    return ok(null);
  } catch {
    return err("Failed to update vendor");
  }
}

export async function archiveVendor(id: string): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  try {
    const result = await db.vendor.updateMany({
      where: { id, businessId },
      data: { archivedAt: new Date() },
    });
    if (result.count === 0) return err("Not found");
    revalidatePath("/vendors");
    return ok(null);
  } catch {
    return err("Failed to archive vendor");
  }
}
