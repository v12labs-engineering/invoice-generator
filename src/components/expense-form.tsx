"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createExpense, updateExpense } from "@/lib/actions/expenses";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = { id: string; name: string };
type Subscription = { id: string; name: string };

type ExpenseForEdit = {
  id: string;
  description: string;
  amount: number;
  date: Date;
  categoryId: string;
  subscriptionId: string | null;
  currency: string;
  paymentMethod: string | null;
  reference: string | null;
  notes: string | null;
};

const PAYMENT_METHODS = ["UPI", "Bank", "Card", "Cash", "Other"] as const;

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function ExpenseForm({
  expense,
  categories,
  subscriptions,
}: {
  expense?: ExpenseForEdit;
  categories: Category[];
  subscriptions: Subscription[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const amountRaw = parseFloat(String(fd.get("amountDisplay") ?? "0"));
    const amountCents = Math.round(amountRaw * 100);

    const input = {
      description: fd.get("description"),
      amount: amountCents,
      date: fd.get("date"),
      categoryId: fd.get("categoryId"),
      subscriptionId: fd.get("subscriptionId"),
      currency: fd.get("currency") ?? "INR",
      paymentMethod: fd.get("paymentMethod"),
      reference: fd.get("reference"),
      notes: fd.get("notes"),
    };

    startTransition(async () => {
      if (expense) {
        const res = await updateExpense(expense.id, input);
        if (res.ok) {
          toast.success("Expense updated");
        } else {
          toast.error(res.error);
        }
      } else {
        const res = await createExpense(input);
        if (res.ok) {
          toast.success("Expense created");
          router.push(`/expenses/${res.data.id}`);
        } else {
          toast.error(res.error);
        }
      }
    });
  }

  const defaultDate = expense
    ? toDateInputValue(expense.date)
    : toDateInputValue(new Date());

  const defaultAmount = expense ? (expense.amount / 100).toFixed(2) : "";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="currency" value={expense?.currency ?? "INR"} />

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          required
          defaultValue={expense?.description ?? ""}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amountDisplay">Amount</Label>
          <Input
            id="amountDisplay"
            name="amountDisplay"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={defaultAmount}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={defaultDate}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">Category</Label>
        <Select name="categoryId" required defaultValue={expense?.categoryId ?? ""}>
          <SelectTrigger id="categoryId" className="w-full h-11">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subscriptionId">Subscription</Label>
        <Select name="subscriptionId" defaultValue={expense?.subscriptionId ?? ""}>
          <SelectTrigger id="subscriptionId" className="w-full h-11">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {subscriptions.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Payment method</Label>
        <Select name="paymentMethod" defaultValue={expense?.paymentMethod ?? ""}>
          <SelectTrigger id="paymentMethod" className="w-full h-11">
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Select method</SelectItem>
            {PAYMENT_METHODS.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference">Reference</Label>
        <Input
          id="reference"
          name="reference"
          placeholder="Invoice #, receipt ID, etc."
          defaultValue={expense?.reference ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={expense?.notes ?? ""}
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {expense ? "Save changes" : "Create expense"}
      </Button>
    </form>
  );
}
