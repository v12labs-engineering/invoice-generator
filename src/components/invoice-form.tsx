"use client";

import { useState } from "react";
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
import { FormSubmitButton } from "@/components/form-submit-button";
import { LogoUpload } from "@/components/logo-upload";
import { TemplatePicker } from "@/components/template-picker";
import { InvoicePreview } from "@/components/invoice-preview";
import { calcInvoiceTotals, calcLineTotal, formatMoney } from "@/lib/money";

type Line = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineDiscount: number;
  taxRate: number;
  sortOrder: number;
};

const selectClass =
  "flex h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base md:text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

type TemplateId = "CLASSIC" | "MODERN" | "MINIMAL";

type ClientInfo = {
  id: string;
  name: string;
  email?: string | null;
  addressLines?: string[];
  taxId?: string | null;
};

type Initial = {
  clientId?: string;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  terms?: string;
  template?: TemplateId;
  lines?: Line[];
};

export function InvoiceForm({
  clients,
  defaultCurrency,
  logoUrl,
  defaultTemplate,
  business,
  initial,
  submitLabel = "Save draft",
  successToast = "Saved",
  onSubmit,
}: {
  clients: ClientInfo[];
  defaultCurrency: string;
  logoUrl: string | null;
  defaultTemplate: TemplateId;
  business: {
    name: string;
    addressLines: string[];
    email: string;
    phone?: string | null;
    taxId?: string | null;
    bankDetails?: string | null;
  };
  initial?: Initial;
  submitLabel?: string;
  successToast?: string | null;
  onSubmit: (fd: FormData) => Promise<void>;
}) {
  const today = new Date().toISOString().slice(0, 10);

  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [issueDate, setIssueDate] = useState(initial?.issueDate ?? today);
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [terms, setTerms] = useState(initial?.terms ?? "");
  const [template, setTemplate] = useState<TemplateId>(initial?.template ?? defaultTemplate);
  const [currentLogoUrl, setCurrentLogoUrl] = useState(logoUrl);
  const [lines, setLines] = useState<Line[]>(
    initial?.lines ?? [
      { description: "", quantity: 1, unitPrice: 0, lineDiscount: 0, taxRate: 0, sortOrder: 0 },
    ],
  );

  const totals = calcInvoiceTotals(lines, 0);
  const selectedClient = clients.find((c) => c.id === clientId);

  function update(i: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function submit(formData: FormData) {
    formData.set("linesJson", JSON.stringify(lines));
    try {
      await onSubmit(formData);
      if (successToast) toast.success(successToast);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  const previewData = {
    number: "DRAFT",
    issueDate: issueDate || today,
    dueDate: dueDate || today,
    currency: defaultCurrency,
    subtotal: totals.subtotal,
    discountAmount: totals.discountAmount,
    taxAmount: totals.taxAmount,
    total: totals.total,
    notes,
    terms,
    business: {
      ...business,
      logoUrl: currentLogoUrl,
    },
    client: selectedClient
      ? {
          name: selectedClient.name,
          email: selectedClient.email ?? null,
          addressLines: selectedClient.addressLines ?? [],
          taxId: selectedClient.taxId ?? null,
        }
      : {
          name: "Client name",
          email: null,
          addressLines: [],
          taxId: null,
        },
    lines: lines.map((l) => ({
      description: l.description || "Item description",
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: calcLineTotal(l).total,
    })),
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(480px,640px)]">
      <form action={submit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Your company logo, shown on every invoice PDF.</CardDescription>
          </CardHeader>
          <CardContent>
            <LogoUpload initialUrl={currentLogoUrl} onChange={setCurrentLogoUrl} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Template</CardTitle>
            <CardDescription>Pick the layout for this invoice&apos;s PDF.</CardDescription>
          </CardHeader>
          <CardContent>
            <TemplatePicker value={template} onChange={setTemplate} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Who is this invoice for and when is it due?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client</Label>
                <select
                  id="clientId"
                  name="clientId"
                  className={selectClass}
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                >
                  <option value="" disabled>
                    Select a client...
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue date</Label>
                <Input
                  id="issueDate"
                  type="date"
                  name="issueDate"
                  required
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  name="dueDate"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <input type="hidden" name="currency" defaultValue={defaultCurrency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line items</CardTitle>
            <CardDescription>Products, services, or one-off charges.</CardDescription>
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
                          onClick={() =>
                            setLines((ls) => ls.filter((_, idx) => idx !== i))
                          }
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
                    <Label className="text-xs text-muted-foreground">
                      Item {i + 1}
                    </Label>
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
            <CardDescription>Optional — shown on the invoice PDF.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms">Terms</Label>
              <Textarea
                id="terms"
                name="terms"
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <input type="hidden" name="template" value={template} />

        <div className="flex justify-end">
          <FormSubmitButton>{submitLabel}</FormSubmitButton>
        </div>
      </form>

      <div className="hidden xl:sticky xl:top-6 xl:block xl:self-start">
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Live preview</CardTitle>
            <CardDescription className="text-xs">Updates as you type.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <InvoicePreview data={previewData} template={template} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
