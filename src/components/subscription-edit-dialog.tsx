"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { Result } from "@/lib/result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ToastForm } from "@/components/toast-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CYCLES = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
] as const;

export type EditableSubscription = {
  id: string;
  name: string;
  url: string | null;
  cost: number | null;
  cycle: string;
  notes: string | null;
};

export function SubscriptionEditDialog({
  subscription,
  action,
}: {
  subscription: EditableSubscription;
  action: (prev: Result<null> | null, formData: FormData) => Promise<Result<null>>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            <Pencil className="size-3.5" />
            Edit
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit subscription</DialogTitle>
          <DialogDescription>Update {subscription.name} details.</DialogDescription>
        </DialogHeader>
        <ToastForm<null>
          className="space-y-4"
          action={async (prev, fd) => {
            const res = await action(prev, fd);
            if (res.ok) setOpen(false);
            return res;
          }}
          successMessage="Subscription updated"
        >
          <div className="space-y-2">
            <Label htmlFor={`name-${subscription.id}`}>Name</Label>
            <Input id={`name-${subscription.id}`} name="name" required defaultValue={subscription.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`url-${subscription.id}`}>URL</Label>
            <Input
              id={`url-${subscription.id}`}
              name="url"
              type="url"
              placeholder="https://..."
              defaultValue={subscription.url ?? ""}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`cost-${subscription.id}`}>Cost</Label>
              <Input
                id={`cost-${subscription.id}`}
                name="costDisplay"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={subscription.cost != null ? (subscription.cost / 100).toFixed(2) : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`cycle-${subscription.id}`}>Billing cycle</Label>
              <Select name="cycle" defaultValue={subscription.cycle}>
                <SelectTrigger id={`cycle-${subscription.id}`} className="w-full h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CYCLES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`notes-${subscription.id}`}>Notes</Label>
            <Textarea
              id={`notes-${subscription.id}`}
              name="notes"
              rows={2}
              placeholder="Plan details, account info..."
              defaultValue={subscription.notes ?? ""}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <FormSubmitButton>Save</FormSubmitButton>
          </DialogFooter>
        </ToastForm>
      </DialogContent>
    </Dialog>
  );
}
