import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { listInvoices } from "@/lib/actions/invoices";
import { formatMoney } from "@/lib/money";
import { effectiveStatus, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function InvoicesPage() {
  const invoices = await listInvoices();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Invoices"
        description="All invoices you've drafted, sent, or been paid on."
        actions={
          <Button render={<Link href="/invoices/new" />}>
            <Plus className="size-4" />
            New invoice
          </Button>
        }
      />

      {invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Create your first invoice to start getting paid."
          action={
            <Button render={<Link href="/invoices/new" />}>
              <Plus className="size-4" />
              New invoice
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="px-4">Number</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="px-4 font-medium">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="hover:underline"
                    >
                      {inv.number ?? "(draft)"}
                    </Link>
                  </TableCell>
                  <TableCell>{inv.client.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {inv.dueDate.toISOString().slice(0, 10)}
                  </TableCell>
                  <TableCell>{formatMoney(inv.total, inv.currency)}</TableCell>
                  <TableCell>
                    <StatusBadge status={effectiveStatus(inv)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
