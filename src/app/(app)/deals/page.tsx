import { Target, Trash2 } from "lucide-react";
import {
  listDeals,
  createDeal,
  moveDealStage,
  deleteDeal,
} from "@/lib/actions/deals";
import { listClients } from "@/lib/actions/clients";
import { listContacts } from "@/lib/actions/contacts";
import type { Result } from "@/lib/result";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ToastForm } from "@/components/toast-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DealStageSelect } from "@/components/deal-stage-select";
import { AddDealDialog } from "@/components/add-deal-dialog";
import { formatMoney } from "@/lib/money";

const STAGES = [
  { key: "LEAD", label: "Lead" },
  { key: "QUALIFIED", label: "Qualified" },
  { key: "PROPOSAL", label: "Proposal" },
  { key: "NEGOTIATION", label: "Negotiation" },
  { key: "WON", label: "Won" },
  { key: "LOST", label: "Lost" },
] as const;

export default async function DealsPage() {
  const [deals, clients, contacts] = await Promise.all([
    listDeals(),
    listClients(),
    listContacts(),
  ]);

  async function add(_prev: Result<{ id: string }> | null, formData: FormData) {
    "use server";
    return createDeal({
      title: formData.get("title"),
      stage: formData.get("stage") || "LEAD",
      clientId: formData.get("clientId"),
      contactId: formData.get("contactId"),
      value: formData.get("value"),
      currency: formData.get("currency") || "USD",
      probability: formData.get("probability"),
      expectedAt: formData.get("expectedAt"),
      notes: formData.get("notes"),
    });
  }

  async function move(id: string, _prev: Result<null> | null, formData: FormData) {
    "use server";
    const stage = String(formData.get("stage") ?? "");
    return moveDealStage(id, stage);
  }

  async function remove(id: string, _prev: Result<null> | null, _fd: FormData) {
    "use server";
    return deleteDeal(id);
  }

  const dealsByStage = Object.fromEntries(
    STAGES.map((s) => [s.key, deals.filter((d) => d.stage === s.key)]),
  );

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Deals" description="Your sales pipeline." />
        <AddDealDialog
          action={add}
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          contacts={contacts.map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>

      {deals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No deals yet"
          description="Click 'New deal' to start tracking your pipeline."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {STAGES.map((s) => {
            const list = dealsByStage[s.key] ?? [];
            const stageValue = list.reduce((sum, d) => sum + (d.value ?? 0), 0);
            return (
              <div key={s.key} className="rounded-lg border bg-muted/30 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold">{s.label}</div>
                  <Badge variant="secondary">{list.length}</Badge>
                </div>
                {stageValue > 0 && (
                  <div className="mb-2 text-xs text-muted-foreground">
                    {formatMoney(stageValue, list[0]?.currency ?? "USD")}
                  </div>
                )}
                <div className="space-y-2">
                  {list.map((d) => (
                    <div key={d.id} className="rounded-md border bg-card p-3 shadow-sm">
                      <div className="font-medium">{d.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {d.client?.name ?? "—"}
                        {d.contact ? ` · ${d.contact.name}` : ""}
                      </div>
                      {d.value != null && (
                        <div className="mt-1 text-sm font-semibold">
                          {formatMoney(d.value, d.currency)}
                        </div>
                      )}
                      {d.probability > 0 && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {d.probability}% likely
                        </div>
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <ToastForm<null>
                          className="flex-1"
                          action={move.bind(null, d.id)}
                          successMessage="Moved"
                        >
                          <DealStageSelect
                            name="stage"
                            defaultValue={d.stage}
                            stages={STAGES}
                          />
                        </ToastForm>
                        <ToastForm<null>
                          action={remove.bind(null, d.id)}
                          successMessage="Deleted"
                        >
                          <Button variant="ghost" size="sm" type="submit">
                            <Trash2 className="size-3.5" />
                          </Button>
                        </ToastForm>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
