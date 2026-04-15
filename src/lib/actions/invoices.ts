"use server";

import { db } from "@/lib/db";
import { InvoiceInput, type InvoiceLineInput } from "@/lib/schemas/invoice";
import { calcInvoiceTotals, calcLineTotal } from "@/lib/money";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";
import { requireUserId } from "./_shared";
import type { InvoiceStatus } from "@prisma/client";

function buildLineData(lines: InvoiceLineInput[]) {
  return lines.map((l) => {
    const { total } = calcLineTotal(l);
    return {
      description: l.description,
      productId: l.productId ?? null,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineDiscount: l.lineDiscount,
      taxRate: l.taxRate,
      sortOrder: l.sortOrder,
      lineTotal: total,
    };
  });
}

export async function listInvoices(status?: InvoiceStatus) {
  const userId = await requireUserId();
  return db.invoice.findMany({
    where: { userId, ...(status ? { status } : {}) },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvoice(id: string) {
  const userId = await requireUserId();
  return db.invoice.findFirst({
    where: { id, userId },
    include: {
      client: true,
      lines: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { paidAt: "desc" } },
    },
  });
}

export async function createInvoice(input: unknown): Promise<Result<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = InvoiceInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  const { subtotal, discountAmount, taxAmount, total } = calcInvoiceTotals(
    parsed.data.lines,
    parsed.data.globalDiscount,
  );

  try {
    const inv = await db.invoice.create({
      data: {
        userId,
        clientId: parsed.data.clientId,
        issueDate: parsed.data.issueDate,
        dueDate: parsed.data.dueDate,
        currency: parsed.data.currency,
        notes: parsed.data.notes || null,
        terms: parsed.data.terms || null,
        subtotal,
        discountAmount,
        taxAmount,
        total,
        balance: total,
        lines: { create: buildLineData(parsed.data.lines) },
      },
    });
    revalidatePath("/invoices");
    return ok({ id: inv.id });
  } catch {
    return err("Failed to create invoice");
  }
}

export async function updateDraftInvoice(id: string, input: unknown): Promise<Result<null>> {
  const userId = await requireUserId();
  const parsed = InvoiceInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  const existing = await db.invoice.findFirst({ where: { id, userId } });
  if (!existing) return err("Not found");
  if (existing.status !== "DRAFT") return err("Only drafts can be edited");

  const { subtotal, discountAmount, taxAmount, total } = calcInvoiceTotals(
    parsed.data.lines,
    parsed.data.globalDiscount,
  );

  try {
    await db.$transaction([
      db.invoiceLine.deleteMany({ where: { invoiceId: id } }),
      db.invoice.update({
        where: { id },
        data: {
          clientId: parsed.data.clientId,
          issueDate: parsed.data.issueDate,
          dueDate: parsed.data.dueDate,
          currency: parsed.data.currency,
          notes: parsed.data.notes || null,
          terms: parsed.data.terms || null,
          subtotal,
          discountAmount,
          taxAmount,
          total,
          balance: total - existing.amountPaid,
          lines: { create: buildLineData(parsed.data.lines) },
        },
      }),
    ]);
    revalidatePath(`/invoices/${id}`);
    return ok(null);
  } catch {
    return err("Failed to update invoice");
  }
}

export async function voidInvoice(id: string): Promise<Result<null>> {
  const userId = await requireUserId();
  const result = await db.invoice.updateMany({
    where: { id, userId },
    data: { status: "VOID" },
  });
  if (result.count === 0) return err("Not found");
  revalidatePath("/invoices");
  return ok(null);
}
