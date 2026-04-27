import { notFound, redirect } from "next/navigation";
import { Ban, CheckCircle2, Download, Receipt, Send, Trash2 } from "lucide-react";
import { listClients } from "@/lib/actions/clients";
import { getBusinessProfile } from "@/lib/actions/settings";
import {
  deleteDraftInvoice,
  finalizeInvoice,
  getInvoice,
  sendInvoice,
  updateDraftInvoice,
  voidInvoice,
} from "@/lib/actions/invoices";
import { recordPayment } from "@/lib/actions/payments";
import { formatMoney } from "@/lib/money";
import type { Result } from "@/lib/result";
import { effectiveStatus, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { FormSubmitButton } from "@/components/form-submit-button";
import { InvoiceForm } from "@/components/invoice-form";
import { ToastForm } from "@/components/toast-form";
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

  // Draft: render the editable form (same component used for /invoices/new) with a live preview.
  if (invoice.status === "DRAFT") {
    const [clients, profile] = await Promise.all([listClients(), getBusinessProfile()]);

    async function save(formData: FormData) {
      "use server";
      const lines = JSON.parse(String(formData.get("linesJson") ?? "[]"));
      const res = await updateDraftInvoice(id, {
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
      if (!res.ok) throw new Error(res.error);
    }
    async function finalize(_prev: Result<null> | null, _fd: FormData) {
      "use server";
      return finalizeInvoice(id);
    }
    async function deleteDraft(_prev: Result<null> | null, _fd: FormData) {
      "use server";
      const res = await deleteDraftInvoice(id);
      if (res.ok) redirect("/invoices");
      return res;
    }

    return (
      <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
        <PageHeader
          title={invoice.number ?? ""}
          description={invoice.client.name}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={effectiveStatus(invoice)} />
              <ToastForm<null> action={deleteDraft} successMessage="Draft deleted">
                <FormSubmitButton variant="outline" size="sm">
                  <Trash2 className="size-3.5" />
                  Delete
                </FormSubmitButton>
              </ToastForm>
              <ToastForm<null> action={finalize} successMessage="Invoice finalized">
                <FormSubmitButton size="sm">
                  <CheckCircle2 className="size-3.5" />
                  Finalize
                </FormSubmitButton>
              </ToastForm>
            </div>
          }
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
            template: (invoice.template ??
              profile?.defaultTemplate ??
              "CLASSIC") as "CLASSIC" | "MODERN" | "MINIMAL",
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
          successToast="Changes saved"
          onSubmit={save}
        />
      </div>
    );
  }

  // Non-draft: read-only summary with Send/Pay/Void actions.
  async function send(_prev: Result<null> | null, fd: FormData) {
    "use server";
    return sendInvoice(id, String(fd.get("to")), String(fd.get("message") ?? ""));
  }
  async function pay(_prev: Result<null> | null, fd: FormData) {
    "use server";
    return recordPayment({
      invoiceId: id,
      amount: Math.round(Number(fd.get("amount")) * 100),
      paidAt: fd.get("paidAt"),
      method: fd.get("method"),
      reference: fd.get("reference"),
    });
  }
  async function voidIt(_prev: Result<null> | null, _fd: FormData) {
    "use server";
    return voidInvoice(id);
  }

  const status = effectiveStatus(invoice);
  const canRecordPayment = invoice.status !== "VOID" && invoice.balance > 0;
  const canVoid = invoice.status !== "VOID" && invoice.status !== "PAID";

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
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
                <Row label="Paid" value={formatMoney(invoice.amountPaid, invoice.currency)} muted />
                <Row
                  label="Balance"
                  value={formatMoney(invoice.balance, invoice.currency)}
                  muted
                />
              </dl>
            </CardContent>
          </Card>

          {canRecordPayment && (
            <Card>
              <CardHeader>
                <CardTitle>Record payment</CardTitle>
                <CardDescription>Log a payment received for this invoice.</CardDescription>
              </CardHeader>
              <CardContent>
                <ToastForm<null>
                  action={pay}
                  successMessage="Payment recorded"
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        required
                      />
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
                        className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base md:text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
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
                    <Input
                      id="reference"
                      name="reference"
                      placeholder="Transaction ID, check #, etc."
                    />
                  </div>
                  <FormSubmitButton>Record payment</FormSubmitButton>
                </ToastForm>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Email invoice</CardTitle>
              <CardDescription>Send this invoice to your client.</CardDescription>
            </CardHeader>
            <CardContent>
              <ToastForm<null>
                action={send}
                successMessage="Invoice sent"
                className="space-y-4"
              >
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
                  <Input
                    id="message"
                    name="message"
                    placeholder="Hi — please find the invoice attached."
                  />
                </div>
                <FormSubmitButton>
                  <Send className="size-4" />
                  Send invoice
                </FormSubmitButton>
              </ToastForm>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
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
              {canVoid && (
                <ToastForm<null> action={voidIt} successMessage="Invoice voided">
                  <FormSubmitButton
                    variant="destructive"
                    className="w-full justify-start"
                  >
                    <Ban className="size-4" />
                    Void invoice
                  </FormSubmitButton>
                </ToastForm>
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
