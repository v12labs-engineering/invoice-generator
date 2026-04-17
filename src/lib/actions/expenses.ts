"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { ExpenseInput } from "@/lib/schemas/expense";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { requireMembership } from "./_shared";

export async function listExpenses(filters?: {
  categoryId?: string;
  subscriptionId?: string;
  from?: Date;
  to?: Date;
  search?: string;
}) {
  const { businessId } = await requireMembership();

  const where: Prisma.ExpenseWhereInput = { businessId };
  if (filters?.categoryId) where.categoryId = filters.categoryId;
  if (filters?.subscriptionId) where.subscriptionId = filters.subscriptionId;
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
    include: { subscription: true, category: true, attachments: true },
    orderBy: { date: "desc" },
  });
}

export async function getExpense(id: string) {
  const { businessId } = await requireMembership();
  return db.expense.findFirst({
    where: { id, businessId },
    include: { subscription: true, category: true, attachments: true },
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
        subscriptionId: parsed.data.subscriptionId || null,
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
        subscriptionId: parsed.data.subscriptionId || null,
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

  const expense = await db.expense.findFirst({
    where: { id, businessId },
    include: { attachments: true },
  });
  if (!expense) return err("Not found");

  if (expense.attachments.length > 0) {
    const storage = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      { auth: { persistSession: false } },
    );
    const BUCKET = "expenses";
    const marker = `/${BUCKET}/`;
    const paths = expense.attachments
      .map((a: { fileUrl: string }) => {
        const idx = a.fileUrl.indexOf(marker);
        return idx !== -1 ? a.fileUrl.slice(idx + marker.length) : null;
      })
      .filter((p): p is string => p !== null);
    if (paths.length > 0) {
      await storage.storage.from(BUCKET).remove(paths);
    }
  }

  try {
    await db.expense.delete({ where: { id } });
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return ok(null);
  } catch {
    return err("Failed to delete expense");
  }
}
