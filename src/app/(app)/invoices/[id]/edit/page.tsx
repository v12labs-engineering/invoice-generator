import { notFound, redirect } from "next/navigation";
import { listClients } from "@/lib/actions/clients";
import { getBusinessProfile } from "@/lib/actions/settings";
import { getInvoice, updateDraftInvoice } from "@/lib/actions/invoices";
import { InvoiceForm } from "@/components/invoice-form";
import { PageHeader } from "@/components/page-header";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [invoice, clients, profile] = await Promise.all([
    getInvoice(id),
    listClients(),
    getBusinessProfile(),
  ]);
  if (!invoice) notFound();
  if (invoice.status !== "DRAFT") redirect(`/invoices/${id}`);

  async function submit(formData: FormData) {
    "use server";
    const lines = JSON.parse(String(formData.get("linesJson") ?? "[]"));
    const result = await updateDraftInvoice(id, {
      clientId: formData.get("clientId"),
      issueDate: formData.get("issueDate"),
      dueDate: formData.get("dueDate"),
      currency: formData.get("currency"),
      notes: formData.get("notes"),
      terms: formData.get("terms"),
      template: formData.get("template"),
      globalDiscount: 0,
      lines,
    });
    if (result.ok) redirect(`/invoices/${id}`);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <PageHeader
        title={`Edit ${invoice.number ?? "(draft)"}`}
        description="Update the draft before finalizing."
      />
      <InvoiceForm
        clients={clients.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          addressLines: c.addressLines,
          taxId: c.taxId,
        }))}
        defaultCurrency={profile?.defaultCurrency ?? "USD"}
        logoUrl={profile?.logoUrl ?? null}
        defaultTemplate={profile?.defaultTemplate ?? "CLASSIC"}
        business={{
          name: profile?.name ?? "Your business",
          addressLines: profile?.addressLines ?? [],
          email: profile?.email ?? "",
          phone: profile?.phone ?? null,
          taxId: profile?.taxId ?? null,
          bankDetails: profile?.bankDetails ?? null,
        }}
        initial={{
          clientId: invoice.clientId,
          issueDate: invoice.issueDate.toISOString().slice(0, 10),
          dueDate: invoice.dueDate.toISOString().slice(0, 10),
          notes: invoice.notes ?? "",
          terms: invoice.terms ?? "",
          template: (invoice.template ?? profile?.defaultTemplate ?? "CLASSIC") as "CLASSIC" | "MODERN" | "MINIMAL",
          lines: invoice.lines.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            lineDiscount: l.lineDiscount,
            taxRate: l.taxRate,
            sortOrder: l.sortOrder,
          })),
        }}
        submitLabel="Save changes"
        onSubmit={submit}
      />
    </div>
  );
}
