import { notFound, redirect } from "next/navigation";
import { Ban, CheckCircle2, Download, Pencil, Receipt, Send, Trash2 } from "lucide-react";
import {
  deleteDraftInvoice,
  finalizeInvoice,
  getInvoice,
  sendInvoice,
  voidInvoice,
} from "@/lib/actions/invoices";
import { recordPayment } from "@/lib/actions/payments";
import { formatMoney } from "@/lib/money";
import { effectiveStatus, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  async function send(fd: FormData) {
    "use server";
    await sendInvoice(id, String(fd.get("to")), String(fd.get("message") ?? ""));
  }
  async function pay(fd: FormData) {
    "use server";
    await recordPayment({
      invoiceId: id,
      amount: Math.round(Number(fd.get("amount")) * 100),
      paidAt: fd.get("paidAt"),
      method: fd.get("method"),
      reference: fd.get("reference"),
    });
  }
  async function voidIt() {
    "use server";
    await voidInvoice(id);
  }
  async function finalize() {
    "use server";
    await finalizeInvoice(id);
  }
  async function deleteDraft() {
    "use server";
    const res = await deleteDraftInvoice(id);
    if (res.ok) redirect("/invoices");
  }

  const status = effectiveStatus(invoice);
  const isDraft = invoice.status === "DRAFT";
  const canSend = invoice.status === "DRAFT";
  const canRecordPayment =
    invoice.status !== "DRAFT" && invoice.status !== "VOID" && invoice.balance > 0;
  const canVoid = invoice.status !== "VOID" && invoice.status !== "PAID";

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <PageHeader
        title={invoice.number ?? ""}
        description={invoice.client.name}
        actions={<StatusBadge status={status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bill to</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="font-medium text-foreground">{invoice.client.name}</div>
              {invoice.client.email && (
                <div className="text-muted-foreground">{invoice.client.email}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Totals</CardTitle>
              <CardDescription>
                Issued {invoice.issueDate.toISOString().slice(0, 10)} · Due{" "}
                {invoice.dueDate.toISOString().slice(0, 10)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <Row label="Subtotal" value={formatMoney(invoice.subtotal, invoice.currency)} />
                <Row label="Tax" value={formatMoney(invoice.taxAmount, invoice.currency)} />
                <div className="h-px bg-border my-2" />
                <Row
                  label="Total"
                  value={formatMoney(invoice.total, invoice.currency)}
                  emphasis
                />
                <Row
                  label="Paid"
                  value={formatMoney(invoice.amountPaid, invoice.currency)}
                  muted
                />
                <Row
                  label="Balance"
                  value={formatMoney(invoice.balance, invoice.currency)}
                  muted
                />
              </dl>
            </CardContent>
          </Card>

          {canSend && (
            <Card>
              <CardHeader>
                <CardTitle>Send invoice</CardTitle>
                <CardDescription>Email this invoice to your client.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={send} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="to">Recipient</Label>
                    <Input
                      id="to"
                      name="to"
                      type="email"
                      required
                      defaultValue={invoice.client.email ?? ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message (optional)</Label>
                    <Input id="message" name="message" />
                  </div>
                  <FormSubmitButton>
                    <Send className="size-4" />
                    Send invoice
                  </FormSubmitButton>
                </form>
              </CardContent>
            </Card>
          )}

          {canRecordPayment && (
            <Card>
              <CardHeader>
                <CardTitle>Record payment</CardTitle>
                <CardDescription>Log a payment received for this invoice.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={pay} className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input id="amount" name="amount" type="number" step="0.01" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paidAt">Date</Label>
                      <Input
                        id="paidAt"
                        name="paidAt"
                        type="date"
                        required
                        defaultValue={new Date().toISOString().slice(0, 10)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="method">Method</Label>
                      <select
                        id="method"
                        name="method"
                        className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                        defaultValue="bank"
                      >
                        <option value="bank">Bank</option>
                        <option value="card">Card</option>
                        <option value="cash">Cash</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference">Reference</Label>
                    <Input id="reference" name="reference" />
                  </div>
                  <FormSubmitButton>Record payment</FormSubmitButton>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isDraft && (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    render={<a href={`/invoices/${invoice.id}/edit`} />}
                  >
                    <Pencil className="size-4" />
                    Edit draft
                  </Button>
                  <form action={finalize}>
                    <Button type="submit" className="w-full justify-start">
                      <CheckCircle2 className="size-4" />
                      Finalize invoice
                    </Button>
                  </form>
                </>
              )}
              <Button
                variant="outline"
                className="w-full justify-start"
                render={
                  <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer" />
                }
              >
                <Download className="size-4" />
                Download PDF
              </Button>
              {canVoid && !isDraft && (
                <form action={voidIt}>
                  <Button
                    variant="destructive"
                    type="submit"
                    className="w-full justify-start"
                  >
                    <Ban className="size-4" />
                    Void invoice
                  </Button>
                </form>
              )}
              {isDraft && (
                <form action={deleteDraft}>
                  <Button
                    variant="destructive"
                    type="submit"
                    className="w-full justify-start"
                  >
                    <Trash2 className="size-4" />
                    Delete draft
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>
                {invoice.payments.length === 0
                  ? "No payments recorded yet."
                  : `${invoice.payments.length} payment${invoice.payments.length === 1 ? "" : "s"} received.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoice.payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-6 text-center text-sm text-muted-foreground">
                  <Receipt className="size-5" />
                  <span>No payments yet.</span>
                </div>
              ) : (
                <ul className="space-y-2 text-sm">
                  {invoice.payments.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between rounded-md border bg-background px-3 py-2"
                    >
                      <div>
                        <div className="font-medium">
                          {formatMoney(p.amount, invoice.currency)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.paidAt.toISOString().slice(0, 10)} · {p.method}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  emphasis,
  muted,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={
        emphasis
          ? "flex items-center justify-between text-base font-semibold"
          : muted
            ? "flex items-center justify-between text-sm text-muted-foreground"
            : "flex items-center justify-between"
      }
    >
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
