import { redirect } from "next/navigation";
import { listClients } from "@/lib/actions/clients";
import { getBusinessProfile } from "@/lib/actions/settings";
import { createInvoice } from "@/lib/actions/invoices";
import { InvoiceForm } from "@/components/invoice-form";
import { PageHeader } from "@/components/page-header";

export default async function NewInvoicePage() {
  const [clients, profile] = await Promise.all([listClients(), getBusinessProfile()]);

  async function submit(formData: FormData) {
    "use server";
    const lines = JSON.parse(String(formData.get("linesJson") ?? "[]"));
    const result = await createInvoice({
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
    if (result.ok) redirect(`/invoices/${result.data.id}`);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader
        title="New invoice"
        description="Draft a new invoice. You can send it after saving."
      />
      <InvoiceForm
        clients={clients}
        defaultCurrency={profile?.defaultCurrency ?? "USD"}
        logoUrl={profile?.logoUrl ?? null}
        defaultTemplate={profile?.defaultTemplate ?? "CLASSIC"}
        onSubmit={submit}
      />
    </div>
  );
}
