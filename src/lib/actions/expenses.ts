"use server";

import { db } from "@/lib/db";
import { ExpenseInput } from "@/lib/schemas/expense";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";
import { requireMembership } from "./_shared";

export async function listExpenses(filters?: {
  categoryId?: string;
  vendorId?: string;
  from?: Date;
  to?: Date;
  search?: string;
}) {
  const { businessId } = await requireMembership();

  const where: Record<string, unknown> = { businessId };
  if (filters?.categoryId) where.categoryId = filters.categoryId;
  if (filters?.vendorId) where.vendorId = filters.vendorId;
  if (filters?.from || filters?.to) {
    where.date = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
  }
  if (filters?.search) {
    where.description = { contains: filters.search, mode: "insensitive" };
  }

  return db.expense.findMany({
    where,
    include: { vendor: true, category: true, attachments: true },
    orderBy: { date: "desc" },
  });
}

export async function getExpense(id: string) {
  const { businessId } = await requireMembership();
  return db.expense.findFirst({
    where: { id, businessId },
    include: { vendor: true, category: true, attachments: true },
  });
}

export async function createExpense(input: unknown): Promise<Result<{ id: string }>> {
  const { businessId, userId } = await requireMembership();
  const parsed = ExpenseInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  try {
    const expense = await db.expense.create({
      data: {
        businessId,
        createdByUserId: userId,
        description: parsed.data.description,
        amount: parsed.data.amount,
        date: parsed.data.date,
        categoryId: parsed.data.categoryId,
        vendorId: parsed.data.vendorId || null,
        currency: parsed.data.currency,
        paymentMethod: parsed.data.paymentMethod || null,
        reference: parsed.data.reference || null,
        notes: parsed.data.notes || null,
      },
    });
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return ok({ id: expense.id });
  } catch {
    return err("Failed to create expense");
  }
}

export async function updateExpense(id: string, input: unknown): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  const parsed = ExpenseInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  try {
    const result = await db.expense.updateMany({
      where: { id, businessId },
      data: {
        description: parsed.data.description,
        amount: parsed.data.amount,
        date: parsed.data.date,
        categoryId: parsed.data.categoryId,
        vendorId: parsed.data.vendorId || null,
        currency: parsed.data.currency,
        paymentMethod: parsed.data.paymentMethod || null,
        reference: parsed.data.reference || null,
        notes: parsed.data.notes || null,
      },
    });
    if (result.count === 0) return err("Not found");
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return ok(null);
  } catch {
    return err("Failed to update expense");
  }
}

export async function deleteExpense(id: string): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  try {
    const result = await db.expense.deleteMany({ where: { id, businessId } });
    if (result.count === 0) return err("Not found");
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return ok(null);
  } catch {
    return err("Failed to delete expense");
  }
}
