"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { calcInvoiceTotals, formatMoney } from "@/lib/money";

type Line = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineDiscount: number;
  taxRate: number;
  sortOrder: number;
};

export function RecurringForm({
  clients,
  defaultCurrency,
  onSubmit,
}: {
  clients: { id: string; name: string }[];
  defaultCurrency: string;
  onSubmit: (fd: FormData) => Promise<void>;
}) {
  const today = new Date().toISOString().slice(0, 10);

  const [lines, setLines] = useState<Line[]>([
    { description: "", quantity: 1, unitPrice: 0, lineDiscount: 0, taxRate: 0, sortOrder: 0 },
  ]);

  const totals = calcInvoiceTotals(lines, 0);

  function update(i: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function submit(formData: FormData) {
    formData.set("linesJson", JSON.stringify(lines));
    try {
      await onSubmit(formData);
      toast.success("Schedule created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create schedule");
    }
  }

  return (
    <form action={submit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cadence</CardTitle>
          <CardDescription>When and how often invoices should auto-generate.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client</Label>
              <Select name="clientId" required defaultValue="">
                <SelectTrigger id="clientId" className="w-full h-11">
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cadence">Cadence</Label>
              <Select name="cadence" defaultValue="MONTHLY" required>
                <SelectTrigger id="cadence" className="w-full h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="intervalCount">Interval</Label>
              <Input
                id="intervalCount"
                name="intervalCount"
                type="number"
                min={1}
                defaultValue={1}
                required
              />
              <p className="text-xs text-muted-foreground">
                E.g. Monthly + Interval 2 = every 2 months.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                name="currency"
                defaultValue={defaultCurrency}
                maxLength={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={today}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End date (optional)</Label>
              <Input id="endDate" name="endDate" type="date" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input
              id="autoSend"
              name="autoSend"
              type="checkbox"
              className="size-4 rounded border-input"
            />
            <Label htmlFor="autoSend" className="text-sm font-normal">
              Auto-send generated invoices to the client via email
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
          <CardDescription>
            These lines are copied into every invoice this schedule generates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="px-3">Description</TableHead>
                  <TableHead className="w-20">Qty</TableHead>
                  <TableHead className="w-32">Unit price</TableHead>
                  <TableHead className="w-24">Tax (bps)</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((l, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-3 align-top">
                      <Textarea
                        value={l.description}
                        onChange={(e) => update(i, { description: e.target.value })}
                        placeholder="Describe the work..."
                        required
                        rows={2}
                        className="min-h-16 resize-y"
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Input
                        type="number"
                        min={1}
                        value={l.quantity}
                        onChange={(e) => update(i, { quantity: Number(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Input
                        type="number"
                        step="0.01"
                        value={(l.unitPrice / 100).toString()}
                        onChange={(e) =>
                          update(i, { unitPrice: Math.round(Number(e.target.value) * 100) })
                        }
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Input
                        type="number"
                        value={l.taxRate}
                        onChange={(e) => update(i, { taxRate: Number(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell className="text-right align-top">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                        aria-label="Remove line"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {lines.map((l, i) => (
              <div key={i} className="space-y-3 rounded-lg border bg-muted/20 p-3">
                <div className="flex items-start justify-between gap-2">
                  <Label className="text-xs text-muted-foreground">Item {i + 1}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                    aria-label="Remove line"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                <Textarea
                  value={l.description}
                  onChange={(e) => update(i, { description: e.target.value })}
                  placeholder="Describe the work..."
                  required
                  rows={2}
                  className="min-h-16 resize-y bg-background"
                />
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={l.quantity}
                      onChange={(e) => update(i, { quantity: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Price</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={(l.unitPrice / 100).toString()}
                      onChange={(e) =>
                        update(i, { unitPrice: Math.round(Number(e.target.value) * 100) })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tax (bps)</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={l.taxRate}
                      onChange={(e) => update(i, { taxRate: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() =>
                setLines((ls) => [
                  ...ls,
                  {
                    description: "",
                    quantity: 1,
                    unitPrice: 0,
                    lineDiscount: 0,
                    taxRate: 0,
                    sortOrder: ls.length,
                  },
                ])
              }
            >
              <Plus className="size-3.5" />
              Add line
            </Button>

            <div className="w-full space-y-1 text-sm sm:w-auto sm:min-w-[220px]">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatMoney(totals.subtotal, defaultCurrency)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>{formatMoney(totals.taxAmount, defaultCurrency)}</span>
              </div>
              <div className="mt-1 flex justify-between border-t pt-1 text-base font-semibold">
                <span>Total</span>
                <span>{formatMoney(totals.total, defaultCurrency)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes & terms</CardTitle>
          <CardDescription>Optional — copied into every generated invoice.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="terms">Terms</Label>
            <Textarea id="terms" name="terms" rows={3} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <FormSubmitButton>Create schedule</FormSubmitButton>
      </div>
    </form>
  );
}
