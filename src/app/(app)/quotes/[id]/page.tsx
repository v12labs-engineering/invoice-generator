import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FileText, Trash2 } from "lucide-react";
import {
  getQuote,
  updateQuoteStatus,
  deleteQuote,
  convertQuoteToInvoice,
} from "@/lib/actions/quotes";
import type { Result } from "@/lib/result";
import type { QuoteStatus } from "@prisma/client";
import { PageHeader } from "@/components/page-header";
import { ToastForm } from "@/components/toast-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { formatMoney } from "@/lib/money";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await getQuote(id);
  if (!quote) notFound();

  async function setStatus(status: QuoteStatus, _prev: Result<null> | null, _fd: FormData) {
    "use server";
    return updateQuoteStatus(id, status);
  }

  async function remove(_prev: Result<null> | null, _fd: FormData) {
    "use server";
    const res = await deleteQuote(id);
    if (res.ok) redirect("/quotes");
    return res;
  }

  async function convert(_prev: Result<{ invoiceId: string }> | null, _fd: FormData) {
    "use server";
    const res = await convertQuoteToInvoice(id);
    if (res.ok) redirect(`/invoices/${res.data.invoiceId}`);
    return res;
  }

  const canDelete = quote.status === "DRAFT";
  const canSend = quote.status === "DRAFT";
  const canAccept = quote.status === "SENT" || quote.status === "DRAFT";
  const canReject = quote.status === "SENT" || quote.status === "DRAFT";
  const canConvert = quote.status === "ACCEPTED" && !quote.convertedInvoiceId;

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
      <div className="flex items-start justify-between">
        <PageHeader
          title={`Quote ${quote.number ?? ""}`}
          description={`${quote.client.name} · ${quote.issueDate.toISOString().slice(0, 10)}`}
        />
        <Badge variant="secondary">{quote.status}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {canSend && (
          <ToastForm<null> action={setStatus.bind(null, "SENT")} successMessage="Marked as sent">
            <Button type="submit" variant="outline">Mark sent</Button>
          </ToastForm>
        )}
        {canAccept && (
          <ToastForm<null> action={setStatus.bind(null, "ACCEPTED")} successMessage="Accepted">
            <Button type="submit">Accept</Button>
          </ToastForm>
        )}
        {canReject && (
          <ToastForm<null> action={setStatus.bind(null, "REJECTED")} successMessage="Rejected">
            <Button type="submit" variant="outline">Reject</Button>
          </ToastForm>
        )}
        {canConvert && (
          <ToastForm<{ invoiceId: string }> action={convert} successMessage="Invoice created">
            <Button type="submit">
              <FileText className="size-4" />
              Convert to invoice
            </Button>
          </ToastForm>
        )}
        {quote.convertedInvoiceId && (
          <Link
            href={`/invoices/${quote.convertedInvoiceId}`}
            className={buttonVariants({ variant: "outline" })}
          >
            View invoice
          </Link>
        )}
        {canDelete && (
          <ToastForm<null> action={remove} successMessage="Deleted">
            <Button type="submit" variant="ghost">
              <Trash2 className="size-4" />
              Delete
            </Button>
          </ToastForm>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
          {quote.expiryDate && (
            <CardDescription>
              Expires {quote.expiryDate.toISOString().slice(0, 10)}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quote.lines.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.description}</TableCell>
                  <TableCell className="text-right tabular-nums">{l.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(l.unitPrice, quote.currency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(l.lineTotal, quote.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex justify-end">
            <div className="w-full max-w-sm space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatMoney(quote.subtotal, quote.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="tabular-nums">−{formatMoney(quote.discountAmount, quote.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="tabular-nums">{formatMoney(quote.taxAmount, quote.currency)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatMoney(quote.total, quote.currency)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {(quote.notes || quote.terms) && (
        <div className="grid gap-4 md:grid-cols-2">
          {quote.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
                {quote.notes}
              </CardContent>
            </Card>
          )}
          {quote.terms && (
            <Card>
              <CardHeader>
                <CardTitle>Terms</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
                {quote.terms}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        <Link href="/quotes" className="hover:underline">
          ← Back to all quotes
        </Link>
      </p>
    </div>
  );
}
