import { redirect } from "next/navigation";
import { listClients } from "@/lib/actions/clients";
import { getBusinessProfile } from "@/lib/actions/settings";
import { createSchedule } from "@/lib/actions/recurring";
import { PageHeader } from "@/components/page-header";
import { RecurringForm } from "@/components/recurring-form";

export default async function NewRecurringPage() {
  const [clients, profile] = await Promise.all([listClients(), getBusinessProfile()]);

  async function submit(formData: FormData) {
    "use server";
    const lines = JSON.parse(String(formData.get("linesJson") ?? "[]"));
    const res = await createSchedule({
      clientId: formData.get("clientId"),
      cadence: formData.get("cadence"),
      intervalCount: Number(formData.get("intervalCount") ?? 1),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate") || null,
      autoSend: formData.get("autoSend") === "on",
      currency: formData.get("currency"),
      notes: formData.get("notes"),
      terms: formData.get("terms"),
      lines,
    });
    if (res.ok) redirect("/recurring");
    throw new Error(res.error);
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
      <PageHeader
        title="New recurring schedule"
        description="Auto-generate an invoice on a cadence. Runs via the daily cron."
      />
      <RecurringForm
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        defaultCurrency={profile?.defaultCurrency ?? "USD"}
        onSubmit={submit}
      />
    </div>
  );
}
