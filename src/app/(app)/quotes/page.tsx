import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { listQuotes } from "@/lib/actions/quotes";
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
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  SENT: "default",
  ACCEPTED: "default",
  REJECTED: "destructive",
  EXPIRED: "outline",
};

export default async function QuotesPage() {
  const quotes = await listQuotes();

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Quotes" description="Proposals and estimates for clients." />
        <Link href="/quotes/new" className={buttonVariants()}>
          <Plus className="size-4" />
          New quote
        </Link>
      </div>

      {quotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No quotes yet"
          description="Create a quote to send a proposal to a client."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="px-4">Number</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Issue date</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="px-4 font-medium">
                    <Link href={`/quotes/${q.id}`} className="hover:underline">
                      {q.number ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell>{q.client.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {q.issueDate.toISOString().slice(0, 10)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {q.expiryDate?.toISOString().slice(0, 10) ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[q.status] ?? "secondary"}>{q.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(q.total, q.currency)}
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
