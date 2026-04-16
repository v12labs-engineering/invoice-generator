"use server";

import { db } from "@/lib/db";
import { ProductInput } from "@/lib/schemas/product";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";
import { requireMembership } from "./_shared";

export async function listProducts() {
  const { businessId } = await requireMembership();
  return db.product.findMany({
    where: { businessId, archivedAt: null },
    orderBy: { name: "asc" },
  });
}

export async function createProduct(input: unknown): Promise<Result<{ id: string }>> {
  const { businessId } = await requireMembership();
  const parsed = ProductInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  try {
    const product = await db.product.create({ data: { ...parsed.data, businessId } });
    revalidatePath("/products");
    return ok({ id: product.id });
  } catch {
    return err("Failed to create product");
  }
}

export async function archiveProduct(id: string): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  const result = await db.product.updateMany({
    where: { id, businessId },
    data: { archivedAt: new Date() },
  });
  if (result.count === 0) return err("Not found");
  revalidatePath("/products");
  return ok(null);
}
