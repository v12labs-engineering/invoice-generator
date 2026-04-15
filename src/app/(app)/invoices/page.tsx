import Link from "next/link";
import { listInvoices } from "@/lib/actions/invoices";
import { formatMoney } from "@/lib/money";
import { effectiveStatus, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

export default async function InvoicesPage() {
  const invoices = await listInvoices();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <Link href="/invoices/new"><Button>New invoice</Button></Link>
      </div>
      <div className="rounded border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3">Number</th>
              <th className="p-3">Client</th>
              <th className="p-3">Due</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b last:border-0">
                <td className="p-3"><Link href={`/invoices/${inv.id}`} className="underline">{inv.number ?? "(draft)"}</Link></td>
                <td className="p-3">{inv.client.name}</td>
                <td className="p-3">{inv.dueDate.toISOString().slice(0, 10)}</td>
                <td className="p-3">{formatMoney(inv.total, inv.currency)}</td>
                <td className="p-3"><StatusBadge status={effectiveStatus(inv)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
