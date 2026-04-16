import { renderToBuffer } from "@react-pdf/renderer";
import { renderTemplate, type InvoicePdfData } from "./templates";
import type { InvoiceTemplate } from "@prisma/client";
import { db } from "@/lib/db";

export type { InvoicePdfData } from "./templates";

export async function buildPdfData(
  invoiceId: string,
  businessId: string,
): Promise<{ data: InvoicePdfData; template: InvoiceTemplate } | null> {
  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, businessId },
    include: { client: true, lines: { orderBy: { sortOrder: "asc" } } },
  });
  if (!invoice) return null;

  const business = await db.business.findUniqueOrThrow({ where: { id: businessId } });

  const data: InvoicePdfData = {
    number: invoice.number ?? "DRAFT",
    issueDate: invoice.issueDate.toISOString().slice(0, 10),
    dueDate: invoice.dueDate.toISOString().slice(0, 10),
    currency: invoice.currency,
    subtotal: invoice.subtotal,
    discountAmount: invoice.discountAmount,
    taxAmount: invoice.taxAmount,
    total: invoice.total,
    notes: invoice.notes,
    terms: invoice.terms,
    business: {
      name: business.name,
      addressLines: business.addressLines,
      email: business.email,
      phone: business.phone,
      taxId: business.taxId,
      bankDetails: business.bankDetails,
      logoUrl: business.logoUrl,
    },
    client: {
      name: invoice.client.name,
      email: invoice.client.email,
      addressLines: invoice.client.addressLines,
      taxId: invoice.client.taxId,
    },
    lines: invoice.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
    })),
  };

  const template = invoice.template ?? business.defaultTemplate ?? "CLASSIC";
  return { data, template };
}

export async function renderInvoicePdf(
  data: InvoicePdfData,
  template: InvoiceTemplate = "CLASSIC",
): Promise<Buffer> {
  return renderToBuffer(renderTemplate(template, data));
}
