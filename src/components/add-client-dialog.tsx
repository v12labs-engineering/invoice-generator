"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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

export function AddClientDialog({
  action,
}: {
  action: (
    prev: Result<{ id: string }> | null,
    fd: FormData,
  ) => Promise<Result<{ id: string }>>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            New client
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add client</DialogTitle>
          <DialogDescription>Create a new customer record.</DialogDescription>
        </DialogHeader>
        <ToastForm<{ id: string }>
          className="space-y-4"
          action={async (prev, fd) => {
            const res = await action(prev, fd);
            if (res.ok) setOpen(false);
            return res;
          }}
          successMessage="Client added"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Acme Inc." required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="billing@acme.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressLines">Address</Label>
            <Textarea
              id="addressLines"
              name="addressLines"
              rows={2}
              placeholder={"123 Main St\nSan Francisco, CA 94105"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxId">Tax ID</Label>
            <Input id="taxId" name="taxId" placeholder="GSTIN, VAT, or EIN" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Internal notes about this client"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <FormSubmitButton>Add client</FormSubmitButton>
          </DialogFooter>
        </ToastForm>
      </DialogContent>
    </Dialog>
  );
}
