import { listClients } from "@/lib/actions/clients";
import { db } from "@/lib/db";
import { requireMembership } from "@/lib/actions/_shared";
import { PageHeader } from "@/components/page-header";
import { QuoteForm } from "@/components/quote-form";

export default async function NewQuotePage() {
  const { businessId } = await requireMembership();
  const [clients, business] = await Promise.all([
    listClients(),
    db.business.findUnique({ where: { id: businessId } }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <PageHeader title="New quote" description="Build a proposal for your client." />
      <QuoteForm clients={clients} defaultCurrency={business?.defaultCurrency ?? "USD"} />
    </div>
  );
}
