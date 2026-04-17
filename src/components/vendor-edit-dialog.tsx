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

export type EditableVendor = {
  id: string;
  name: string;
  email: string | null;
  addressLines: string[];
  notes: string | null;
};

export function VendorEditDialog({
  vendor,
  action,
}: {
  vendor: EditableVendor;
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
          <DialogTitle>Edit vendor</DialogTitle>
          <DialogDescription>Update {vendor.name}&apos;s details.</DialogDescription>
        </DialogHeader>
        <ToastForm<null>
          className="space-y-4"
          action={async (prev, fd) => {
            const res = await action(prev, fd);
            if (res.ok) setOpen(false);
            return res;
          }}
          successMessage="Vendor updated"
        >
          <div className="space-y-2">
            <Label htmlFor={`name-${vendor.id}`}>Name</Label>
            <Input id={`name-${vendor.id}`} name="name" required defaultValue={vendor.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`email-${vendor.id}`}>Email</Label>
            <Input
              id={`email-${vendor.id}`}
              name="email"
              type="email"
              defaultValue={vendor.email ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`addressLines-${vendor.id}`}>Address</Label>
            <Textarea
              id={`addressLines-${vendor.id}`}
              name="addressLines"
              rows={2}
              defaultValue={vendor.addressLines.join("\n")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`notes-${vendor.id}`}>Notes</Label>
            <Textarea
              id={`notes-${vendor.id}`}
              name="notes"
              rows={2}
              defaultValue={vendor.notes ?? ""}
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
