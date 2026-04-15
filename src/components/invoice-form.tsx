"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { calcInvoiceTotals } from "@/lib/money";

type Line = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineDiscount: number;
  taxRate: number;
  sortOrder: number;
};

export function InvoiceForm({
  clients,
  defaultCurrency,
  onSubmit,
}: {
  clients: { id: string; name: string }[];
  defaultCurrency: string;
  onSubmit: (fd: FormData) => Promise<void>;
}) {
  const [lines, setLines] = useState<Line[]>([
    { description: "", quantity: 1, unitPrice: 0, lineDiscount: 0, taxRate: 0, sortOrder: 0 },
  ]);

  const totals = calcInvoiceTotals(lines, 0);

  function update(i: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function submit(formData: FormData) {
    formData.set("linesJson", JSON.stringify(lines));
    await onSubmit(formData);
  }

  return (
    <form action={submit} className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label htmlFor="clientId">Client</Label>
          <select name="clientId" className="w-full rounded border p-2" required>
            <option value="">Select...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="issueDate">Issue date</Label>
          <Input type="date" name="issueDate" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="dueDate">Due date</Label>
          <Input type="date" name="dueDate" required />
        </div>
      </div>

      <Input type="hidden" name="currency" defaultValue={defaultCurrency} />

      <div className="rounded border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-2">Description</th>
              <th className="p-2 w-20">Qty</th>
              <th className="p-2 w-28">Unit price</th>
              <th className="p-2 w-24">Tax (bps)</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="p-2"><Input value={l.description} onChange={(e) => update(i, { description: e.target.value })} required /></td>
                <td className="p-2"><Input type="number" min={1} value={l.quantity} onChange={(e) => update(i, { quantity: Number(e.target.value) })} /></td>
                <td className="p-2"><Input type="number" step="0.01" value={(l.unitPrice / 100).toString()} onChange={(e) => update(i, { unitPrice: Math.round(Number(e.target.value) * 100) })} /></td>
                <td className="p-2"><Input type="number" value={l.taxRate} onChange={(e) => update(i, { taxRate: Number(e.target.value) })} /></td>
                <td className="p-2 text-right">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}>×</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setLines((ls) => [
              ...ls,
              { description: "", quantity: 1, unitPrice: 0, lineDiscount: 0, taxRate: 0, sortOrder: ls.length },
            ])
          }
        >
          Add line
        </Button>
        <div className="text-right text-sm">
          <div>Subtotal: {(totals.subtotal / 100).toFixed(2)}</div>
          <div>Tax: {(totals.taxAmount / 100).toFixed(2)}</div>
          <div className="text-base font-semibold">Total: {(totals.total / 100).toFixed(2)}</div>
        </div>
      </div>

      <div className="space-y-1"><Label htmlFor="notes">Notes</Label><Textarea name="notes" /></div>
      <div className="space-y-1"><Label htmlFor="terms">Terms</Label><Textarea name="terms" /></div>

      <Button type="submit">Save draft</Button>
    </form>
  );
}
