import { Plus, Trash2, Store } from "lucide-react";
import {
  listSubscriptions,
  createSubscription,
  archiveSubscription,
  updateSubscription,
} from "@/lib/actions/subscriptions";
import { db } from "@/lib/db";
import { requireMembership } from "@/lib/actions/_shared";
import { formatMoney } from "@/lib/money";
import type { Result } from "@/lib/result";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ToastForm } from "@/components/toast-form";
import { SubscriptionEditDialog } from "@/components/subscription-edit-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CYCLES = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
] as const;

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
  const [subscriptions, { businessId }] = await Promise.all([listSubscriptions(), requireMembership()]);
  const business = await db.business.findUnique({ where: { id: businessId } });
  const currency = business?.defaultCurrency ?? "USD";

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
      cycle: formData.get("cycle"),
      notes: formData.get("notes"),
    });
  }

  async function edit(id: string, _prev: Result<null> | null, formData: FormData) {
    "use server";
    return updateSubscription(id, {
      name: formData.get("name"),
      url: formData.get("url"),
      cost: parseCost(formData),
      cycle: formData.get("cycle"),
      notes: formData.get("notes"),
    });
  }

  async function archive(id: string, _prev: Result<null> | null, _fd: FormData) {
    "use server";
    return archiveSubscription(id);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <PageHeader title="Subscriptions" description="Track your recurring services and tools." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Add subscription</CardTitle>
            <CardDescription>Track a new service or tool.</CardDescription>
          </CardHeader>
          <CardContent>
            <ToastForm<{ id: string }>
              className="space-y-4"
              action={add}
              successMessage="Subscription added"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required placeholder="AWS, Figma, Slack..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input id="url" name="url" type="url" placeholder="https://..." />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="costDisplay">Cost</Label>
                  <Input id="costDisplay" name="costDisplay" type="number" step="0.01" min="0" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cycle">Billing cycle</Label>
                  <Select name="cycle" defaultValue="MONTHLY">
                    <SelectTrigger id="cycle" className="w-full h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CYCLES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={2} placeholder="Plan details, account info..." />
              </div>
              <FormSubmitButton>
                <Plus className="size-4" />
                Add subscription
              </FormSubmitButton>
            </ToastForm>
          </CardContent>
        </Card>

        <div>
          {subscriptions.length === 0 ? (
            <EmptyState
              icon={Store}
              title="No subscriptions yet"
              description="Add your first subscription using the form on the left."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="px-4">Name</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Total spent</TableHead>
                    <TableHead className="w-40" />
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
                          <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:underline">
                            {s.url.replace(/^https?:\/\//, "")}
                          </a>
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {s.cost != null ? formatMoney(s.cost, currency) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {CYCLE_LABELS[s.cycle] ?? s.cycle}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {stats?._count ?? 0}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {stats?._sum.amount != null
                          ? formatMoney(Number(stats._sum.amount), currency)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <SubscriptionEditDialog
                            subscription={{
                              id: s.id,
                              name: s.name,
                              url: s.url,
                              cost: s.cost,
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
                              Archive
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
      </div>
    </div>
  );
}
