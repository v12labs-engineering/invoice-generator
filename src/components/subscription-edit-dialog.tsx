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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type EditableSubscription = {
  id: string;
  name: string;
  email: string | null;
  addressLines: string[];
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
          <DialogDescription>Update {subscription.name}&apos;s details.</DialogDescription>
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
            <Label htmlFor={`email-${subscription.id}`}>Email</Label>
            <Input
              id={`email-${subscription.id}`}
              name="email"
              type="email"
              defaultValue={subscription.email ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`addressLines-${subscription.id}`}>Address</Label>
            <Textarea
              id={`addressLines-${subscription.id}`}
              name="addressLines"
              rows={2}
              defaultValue={subscription.addressLines.join("\n")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`notes-${subscription.id}`}>Notes</Label>
            <Textarea
              id={`notes-${subscription.id}`}
              name="notes"
              rows={2}
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
