import { listClients } from "@/lib/actions/clients";
import { getBusinessProfile } from "@/lib/actions/settings";
import { createInvoice } from "@/lib/actions/invoices";
import { InvoiceForm } from "@/components/invoice-form";
import { redirect } from "next/navigation";

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
      globalDiscount: 0,
      lines,
    });
    if (result.ok) redirect(`/invoices/${result.data.id}`);
  }

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">New Invoice</h1>
      <InvoiceForm clients={clients} defaultCurrency={profile?.defaultCurrency ?? "USD"} onSubmit={submit} />
    </div>
  );
}
