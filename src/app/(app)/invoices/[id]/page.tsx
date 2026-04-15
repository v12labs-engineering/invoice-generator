import { getInvoice, sendInvoice, voidInvoice } from "@/lib/actions/invoices";
import { recordPayment } from "@/lib/actions/payments";
import { formatMoney } from "@/lib/money";
import { effectiveStatus, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notFound } from "next/navigation";

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

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{invoice.number ?? "(draft)"}</h1>
          <p className="text-sm text-muted-foreground">{invoice.client.name}</p>
        </div>
        <StatusBadge status={effectiveStatus(invoice)} />
      </div>

      <div className="rounded border p-4">
        <div className="mb-2 flex justify-between"><span>Subtotal</span><span>{formatMoney(invoice.subtotal, invoice.currency)}</span></div>
        <div className="mb-2 flex justify-between"><span>Tax</span><span>{formatMoney(invoice.taxAmount, invoice.currency)}</span></div>
        <div className="flex justify-between font-semibold"><span>Total</span><span>{formatMoney(invoice.total, invoice.currency)}</span></div>
        <div className="mt-2 flex justify-between text-sm text-muted-foreground"><span>Paid</span><span>{formatMoney(invoice.amountPaid, invoice.currency)}</span></div>
        <div className="flex justify-between text-sm"><span>Balance</span><span>{formatMoney(invoice.balance, invoice.currency)}</span></div>
      </div>

      <div className="flex gap-3">
        <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer"><Button variant="outline">Download PDF</Button></a>
        {invoice.status !== "VOID" && invoice.status !== "PAID" && (
          <form action={voidIt}><Button variant="outline" type="submit">Void</Button></form>
        )}
      </div>

      {invoice.status === "DRAFT" && (
        <form action={send} className="rounded border p-4 space-y-3">
          <h2 className="font-semibold">Send invoice</h2>
          <div className="space-y-1"><Label htmlFor="to">Recipient</Label><Input name="to" type="email" required defaultValue={invoice.client.email ?? ""} /></div>
          <div className="space-y-1"><Label htmlFor="message">Message (optional)</Label><Input name="message" /></div>
          <Button type="submit">Send</Button>
        </form>
      )}

      {invoice.status !== "DRAFT" && invoice.status !== "VOID" && invoice.balance > 0 && (
        <form action={pay} className="rounded border p-4 space-y-3">
          <h2 className="font-semibold">Record payment</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1"><Label htmlFor="amount">Amount</Label><Input name="amount" type="number" step="0.01" required /></div>
            <div className="space-y-1"><Label htmlFor="paidAt">Date</Label><Input name="paidAt" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></div>
            <div className="space-y-1">
              <Label htmlFor="method">Method</Label>
              <select name="method" className="w-full rounded border p-2" defaultValue="bank">
                <option value="bank">Bank</option>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="space-y-1"><Label htmlFor="reference">Reference</Label><Input name="reference" /></div>
          <Button type="submit">Record payment</Button>
        </form>
      )}

      <div className="rounded border p-4">
        <h2 className="mb-2 font-semibold">Payments</h2>
        {invoice.payments.length === 0 && <p className="text-sm text-muted-foreground">No payments yet.</p>}
        {invoice.payments.map((p) => (
          <div key={p.id} className="flex justify-between border-b py-2 text-sm last:border-0">
            <span>{p.paidAt.toISOString().slice(0, 10)} · {p.method}</span>
            <span>{formatMoney(p.amount, invoice.currency)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
