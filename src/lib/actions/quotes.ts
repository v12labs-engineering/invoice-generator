"use server";

import { db } from "@/lib/db";
import { QuoteInput, type QuoteLineInput } from "@/lib/schemas/crm";
import { calcInvoiceTotals, calcLineTotal } from "@/lib/money";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";
import { requireMembership } from "./_shared";
import { assignInvoiceNumber } from "@/lib/invoice-number";
import type { QuoteStatus } from "@prisma/client";

function buildLineData(lines: QuoteLineInput[]) {
  return lines.map((l) => {
    const { total } = calcLineTotal(l);
    return {
      description: l.description,
      productId: l.productId || null,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineDiscount: l.lineDiscount,
      taxRate: l.taxRate,
      sortOrder: l.sortOrder,
      lineTotal: total,
    };
  });
}

async function nextQuoteNumber(businessId: string): Promise<string> {
  const count = await db.quote.count({ where: { businessId } });
  return `Q-${String(count + 1).padStart(4, "0")}`;
}

export async function listQuotes(status?: QuoteStatus) {
  const { businessId } = await requireMembership();
  return db.quote.findMany({
    where: { businessId, ...(status ? { status } : {}) },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getQuote(id: string) {
  const { businessId } = await requireMembership();
  return db.quote.findFirst({
    where: { id, businessId },
    include: {
      client: true,
      deal: true,
      lines: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function createQuote(input: unknown): Promise<Result<{ id: string }>> {
  const { businessId } = await requireMembership();
  const parsed = QuoteInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  const totals = calcInvoiceTotals(parsed.data.lines, parsed.data.globalDiscount);

  try {
    const number = await nextQuoteNumber(businessId);
    const quote = await db.quote.create({
      data: {
        businessId,
        number,
        clientId: parsed.data.clientId,
        dealId: parsed.data.dealId || null,
        issueDate: parsed.data.issueDate,
        expiryDate: parsed.data.expiryDate,
        currency: parsed.data.currency,
        notes: parsed.data.notes || null,
        terms: parsed.data.terms || null,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        total: totals.total,
        lines: { create: buildLineData(parsed.data.lines) },
      },
    });
    revalidatePath("/quotes");
    return ok({ id: quote.id });
  } catch {
    return err("Failed to create quote");
  }
}

export async function updateQuoteStatus(
  id: string,
  status: QuoteStatus,
): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  const result = await db.quote.updateMany({
    where: { id, businessId },
    data: { status },
  });
  if (result.count === 0) return err("Not found");
  revalidatePath(`/quotes/${id}`);
  revalidatePath("/quotes");
  return ok(null);
}

export async function deleteQuote(id: string): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  const existing = await db.quote.findFirst({ where: { id, businessId } });
  if (!existing) return err("Not found");
  if (existing.status !== "DRAFT") return err("Only draft quotes can be deleted");
  await db.quote.delete({ where: { id } });
  revalidatePath("/quotes");
  return ok(null);
}

/** Convert an accepted quote into a DRAFT invoice. */
export async function convertQuoteToInvoice(
  id: string,
): Promise<Result<{ invoiceId: string }>> {
  const { businessId, userId } = await requireMembership();
  const quote = await db.quote.findFirst({
    where: { id, businessId },
    include: { lines: { orderBy: { sortOrder: "asc" } } },
  });
  if (!quote) return err("Not found");
  if (quote.status !== "ACCEPTED") return err("Only accepted quotes can be converted");
  if (quote.convertedInvoiceId) return err("Already converted");

  try {
    const number = await assignInvoiceNumber(businessId);
    const invoice = await db.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          businessId,
          createdByUserId: userId,
          number,
          clientId: quote.clientId,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          currency: quote.currency,
          subtotal: quote.subtotal,
          discountAmount: quote.discountAmount,
          taxAmount: quote.taxAmount,
          total: quote.total,
          balance: quote.total,
          notes: quote.notes,
          terms: quote.terms,
          lines: {
            create: quote.lines.map((l) => ({
              description: l.description,
              productId: l.productId,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              lineDiscount: l.lineDiscount,
              taxRate: l.taxRate,
              lineTotal: l.lineTotal,
              sortOrder: l.sortOrder,
            })),
          },
        },
      });
      await tx.quote.update({
        where: { id: quote.id },
        data: { convertedInvoiceId: inv.id },
      });
      return inv;
    });

    revalidatePath(`/quotes/${id}`);
    revalidatePath("/invoices");
    return ok({ invoiceId: invoice.id });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Conversion failed");
  }
}
