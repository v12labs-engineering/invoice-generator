"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calcInvoiceTotals, formatMoney } from "@/lib/money";
import { createQuote } from "@/lib/actions/quotes";

type Client = { id: string; name: string };

type Line = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineDiscount: number;
  taxRate: number;
};

const emptyLine = (): Line => ({
  description: "",
  quantity: 1,
  unitPrice: 0,
  lineDiscount: 0,
  taxRate: 0,
});

export function QuoteForm({
  clients,
  defaultCurrency,
}: {
  clients: Client[];
  defaultCurrency: string;
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [issueDate, setIssueDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [expiryDate, setExpiryDate] = useState("");
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);

  const totals = useMemo(() => calcInvoiceTotals(lines, globalDiscount), [lines, globalDiscount]);

  const updateLine = (i: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!clientId) {
      toast.error("Select a client");
      return;
    }
    const validLines = lines.filter((l) => l.description.trim().length > 0);
    if (validLines.length === 0) {
      toast.error("Add at least one line");
      return;
    }
    setSubmitting(true);
    const res = await createQuote({
      clientId,
      issueDate,
      expiryDate: expiryDate || null,
      currency,
      notes,
      terms,
      globalDiscount,
      lines: validLines.map((l, i) => ({ ...l, sortOrder: i })),
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success("Quote created");
      router.push(`/quotes/${res.data.id}`);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Who and when.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={(v) => setClientId(v ?? "")}>
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder="Select a client..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Issue date</Label>
            <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Expiry date</Label>
            <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Input maxLength={3} value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-20">Qty</TableHead>
                  <TableHead className="w-28">Unit (¢)</TableHead>
                  <TableHead className="w-28">Discount (¢)</TableHead>
                  <TableHead className="w-24">Tax %</TableHead>
                  <TableHead className="w-28 text-right">Total</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((l, i) => {
                  const after = Math.max(0, l.quantity * l.unitPrice - l.lineDiscount);
                  const tax = Math.round((after * l.taxRate) / 10000);
                  return (
                    <TableRow key={i}>
                      <TableCell>
                        <Input
                          value={l.description}
                          onChange={(e) => updateLine(i, { description: e.target.value })}
                          placeholder="Description"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={l.quantity}
                          onChange={(e) => updateLine(i, { quantity: Number(e.target.value) || 0 })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={l.unitPrice}
                          onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) || 0 })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={l.lineDiscount}
                          onChange={(e) => updateLine(i, { lineDiscount: Number(e.target.value) || 0 })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={l.taxRate / 100}
                          onChange={(e) =>
                            updateLine(i, { taxRate: Math.round((Number(e.target.value) || 0) * 100) })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(after + tax, currency)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                          disabled={lines.length === 1}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLines((prev) => [...prev, emptyLine()])}
          >
            <Plus className="size-4" />
            Add line
          </Button>

          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2 rounded-md border bg-muted/30 p-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatMoney(totals.subtotal, currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="globalDiscount">Global discount (¢)</Label>
                <Input
                  id="globalDiscount"
                  className="w-32"
                  type="number"
                  min={0}
                  value={globalDiscount}
                  onChange={(e) => setGlobalDiscount(Number(e.target.value) || 0)}
                />
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="tabular-nums">−{formatMoney(totals.discountAmount, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="tabular-nums">{formatMoney(totals.taxAmount, currency)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatMoney(totals.total, currency)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes &amp; terms</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Terms</Label>
            <Textarea rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create quote"}
        </Button>
      </div>
    </form>
  );
}
