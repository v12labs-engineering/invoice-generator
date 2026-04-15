"use server";

import { db } from "@/lib/db";
import { InvoiceInput, type InvoiceLineInput } from "@/lib/schemas/invoice";
import { calcInvoiceTotals, calcLineTotal } from "@/lib/money";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";
import { requireUserId } from "./_shared";
import type { InvoiceStatus } from "@prisma/client";
import { assignInvoiceNumber } from "@/lib/invoice-number";
import { buildPdfData, renderInvoicePdf } from "@/lib/pdf/render";
import { sendInvoiceEmail } from "@/lib/email/send-invoice";
import { put } from "@vercel/blob";

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
        template: parsed.data.template ?? null,
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
          template: parsed.data.template ?? null,
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

export async function finalizeInvoice(id: string): Promise<Result<null>> {
  const userId = await requireUserId();

  const invoice = await db.invoice.findFirst({ where: { id, userId } });
  if (!invoice) return err("Not found");
  if (invoice.status !== "DRAFT") return err("Only drafts can be finalized");

  try {
    let number = invoice.number;
    if (!number) {
      number = await assignInvoiceNumber(userId);
      await db.invoice.update({ where: { id }, data: { number } });
    }

    const built = await buildPdfData(id, userId);
    if (!built) return err("Failed to build PDF data");
    const pdfBuffer = await renderInvoicePdf(built.data, built.template);

    let pdfUrl: string | null = null;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`invoices/${number}.pdf`, pdfBuffer, {
        access: "public",
        contentType: "application/pdf",
        allowOverwrite: true,
      });
      pdfUrl = blob.url;
    }

    await db.invoice.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date(), ...(pdfUrl ? { pdfUrl } : {}) },
    });

    revalidatePath(`/invoices/${id}`);
    revalidatePath("/invoices");
    return ok(null);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Finalize failed");
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

export async function sendInvoice(
  id: string,
  recipientEmail: string,
  message?: string,
): Promise<Result<null>> {
  const userId = await requireUserId();

  const invoice = await db.invoice.findFirst({
    where: { id, userId },
    include: { client: true },
  });
  if (!invoice) return err("Not found");
  if (invoice.status === "VOID") return err("Invoice is void");
  if (!recipientEmail) return err("Recipient email required");

  try {
    // Assign number if not yet assigned
    let number = invoice.number;
    if (!number) {
      number = await assignInvoiceNumber(userId);
      await db.invoice.update({ where: { id }, data: { number } });
    }

    // Render PDF
    const built = await buildPdfData(id, userId);
    if (!built) return err("Failed to build PDF data");
    const pdfData = built.data;
    const pdfBuffer = await renderInvoicePdf(built.data, built.template);

    // Upload to Vercel Blob
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return err("BLOB_READ_WRITE_TOKEN not configured");
    }
    const blob = await put(`invoices/${number}.pdf`, pdfBuffer, {
      access: "public",
      contentType: "application/pdf",
      allowOverwrite: true,
    });

    // Send email
    await sendInvoiceEmail({
      to: recipientEmail,
      subject: `Invoice ${number} from ${pdfData.business.name}`,
      body:
        message ??
        `Hi ${invoice.client.name},\n\nPlease find invoice ${number} attached.\n\nTotal: ${(invoice.total / 100).toFixed(2)} ${invoice.currency}\nDue: ${pdfData.dueDate}\n\nThanks.`,
      pdfBuffer,
      pdfFilename: `${number}.pdf`,
    });

    // Transition to SENT
    await db.invoice.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date(), pdfUrl: blob.url },
    });

    revalidatePath(`/invoices/${id}`);
    revalidatePath("/invoices");
    return ok(null);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Send failed");
  }
}
