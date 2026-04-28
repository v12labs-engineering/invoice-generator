import { Trash2, Store, Pause, Play } from "lucide-react";
import {
  listSubscriptions,
  createSubscription,
  archiveSubscription,
  updateSubscription,
  toggleSubscription,
} from "@/lib/actions/subscriptions";
import { db } from "@/lib/db";
import { requireMembership } from "@/lib/actions/_shared";
import { formatMoney } from "@/lib/money";
import type { Result } from "@/lib/result";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ToastForm } from "@/components/toast-form";
import { SubscriptionEditDialog } from "@/components/subscription-edit-dialog";
import { AddSubscriptionDialog } from "@/components/add-subscription-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const CYCLE_LABELS: Record<string, string> = {
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
};

function parseCost(fd: FormData): number | undefined {
  const raw = String(fd.get("costDisplay") ?? "").trim();
  if (!raw) return undefined;
  return Math.round(parseFloat(raw) * 100);
}

export default async function SubscriptionsPage() {
  const [subscriptions, { businessId }] = await Promise.all([
    listSubscriptions(),
    requireMembership(),
  ]);
  const business = await db.business.findUnique({ where: { id: businessId } });
  const defaultCurrency = business?.defaultCurrency ?? "USD";

  const rawStats = await db.expense.groupBy({
    by: ["subscriptionId"],
    where: { businessId, subscriptionId: { not: null } },
    _count: true,
    _sum: { amount: true },
  });
  const statsMap = new Map(rawStats.map((s) => [s.subscriptionId!, s]));

  async function add(_prev: Result<{ id: string }> | null, formData: FormData) {
    "use server";
    return createSubscription({
      name: formData.get("name"),
      url: formData.get("url"),
      cost: parseCost(formData),
      currency: formData.get("currency") || defaultCurrency,
      cycle: formData.get("cycle"),
      startDate: formData.get("startDate"),
      notes: formData.get("notes"),
    });
  }

  async function edit(id: string, _prev: Result<null> | null, formData: FormData) {
    "use server";
    return updateSubscription(id, {
      name: formData.get("name"),
      url: formData.get("url"),
      cost: parseCost(formData),
      currency: formData.get("currency") || defaultCurrency,
      cycle: formData.get("cycle"),
      notes: formData.get("notes"),
    });
  }

  async function toggle(id: string, _prev: Result<null> | null, _fd: FormData) {
    "use server";
    return toggleSubscription(id);
  }

  async function archive(id: string, _prev: Result<null> | null, _fd: FormData) {
    "use server";
    return archiveSubscription(id);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          title="Subscriptions"
          description="Recurring services that auto-generate expenses on their billing cycle."
        />
        <AddSubscriptionDialog action={add} defaultDate={today} defaultCurrency={defaultCurrency} />
      </div>

      {subscriptions.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No subscriptions yet"
          description="Click 'New subscription' to start tracking recurring services."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="px-4">Name</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Cycle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total spent</TableHead>
                <TableHead className="w-48" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((s) => {
                const stats = statsMap.get(s.id);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="px-4">
                      <div className="font-medium">{s.name}</div>
                      {s.url && (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-muted-foreground hover:underline"
                        >
                          {s.url.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {s.cost != null ? formatMoney(s.cost, s.currency) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {CYCLE_LABELS[s.cycle] ?? s.cycle}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.active
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s.active ? "Active" : "Paused"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {stats?._sum.amount != null
                        ? formatMoney(Number(stats._sum.amount), s.currency)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <ToastForm<null>
                          action={toggle.bind(null, s.id)}
                          successMessage={s.active ? "Paused" : "Resumed"}
                        >
                          <Button variant="ghost" size="sm" type="submit">
                            {s.active ? (
                              <Pause className="size-3.5" />
                            ) : (
                              <Play className="size-3.5" />
                            )}
                            {s.active ? "Pause" : "Resume"}
                          </Button>
                        </ToastForm>
                        <SubscriptionEditDialog
                          subscription={{
                            id: s.id,
                            name: s.name,
                            url: s.url,
                            cost: s.cost,
                            currency: s.currency,
                            cycle: s.cycle,
                            notes: s.notes,
                          }}
                          action={edit.bind(null, s.id)}
                        />
                        <ToastForm<null>
                          action={archive.bind(null, s.id)}
                          successMessage="Subscription archived"
                        >
                          <Button variant="ghost" size="sm" type="submit">
                            <Trash2 className="size-3.5" />
                          </Button>
                        </ToastForm>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
