import { renderToBuffer } from "@react-pdf/renderer";
import { InvoiceDocument, type InvoicePdfData } from "./invoice-template";
import { db } from "@/lib/db";

export async function buildPdfData(invoiceId: string, userId: string): Promise<InvoicePdfData | null> {
  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: { client: true, lines: { orderBy: { sortOrder: "asc" } } },
  });
  if (!invoice) return null;

  const profile = await db.businessProfile.findUniqueOrThrow({ where: { userId } });

  return {
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
      name: profile.name,
      addressLines: profile.addressLines,
      email: profile.email,
      phone: profile.phone,
      taxId: profile.taxId,
      bankDetails: profile.bankDetails,
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
}

export async function renderInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument data={data} />);
}
