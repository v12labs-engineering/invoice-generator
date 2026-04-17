import Link from "next/link";
import { FileUp, Paperclip, Receipt } from "lucide-react";
import { listExpenses } from "@/lib/actions/expenses";
import { requireMembership } from "@/lib/actions/_shared";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;

  const [expenses, { businessId }] = await Promise.all([
    listExpenses({
      categoryId: sp.category,
      vendorId: sp.vendor,
      search: sp.q,
    }),
    requireMembership(),
  ]);

  const business = await db.business.findUnique({ where: { id: businessId } });
  const currency = business?.defaultCurrency ?? "INR";

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Expenses"
        description="Track and manage your business expenses."
        actions={
          <>
            <Button variant="outline" size="sm" render={<Link href="/expenses/import" />}>
              <FileUp className="size-4" />
              Import CSV
            </Button>
            <Button size="sm" render={<Link href="/expenses/new" />}>
              Add expense
            </Button>
          </>
        }
      />

      {expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No expenses yet"
          description="Add your first expense or import from a CSV file."
          action={
            <Button size="sm" render={<Link href="/expenses/new" />}>
              Add expense
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="px-4">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((e) => (
                <TableRow key={e.id} className="cursor-pointer hover:bg-muted/30">
                  <TableCell className="px-4 text-muted-foreground">
                    <Link href={`/expenses/${e.id}`} className="block">
                      {e.date.toISOString().slice(0, 10)}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/expenses/${e.id}`} className="block hover:underline">
                      {e.description}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <Link href={`/expenses/${e.id}`} className="block">
                      {e.vendor?.name ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/expenses/${e.id}`} className="block">
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
                        {e.category.name}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    <Link href={`/expenses/${e.id}`} className="block">
                      {formatMoney(e.amount, e.currency)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-center">
                    {e.attachments.length > 0 && (
                      <Paperclip className="size-3.5 text-muted-foreground" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
            <span>
              {expenses.length} expense{expenses.length === 1 ? "" : "s"}
            </span>
            <span className="font-medium text-foreground">{formatMoney(total, currency)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
