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

export type EditableClient = {
  id: string;
  name: string;
  email: string | null;
  addressLines: string[];
  taxId: string | null;
  notes: string | null;
};

export function ClientEditDialog({
  client,
  action,
}: {
  client: EditableClient;
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
          <DialogTitle>Edit client</DialogTitle>
          <DialogDescription>Update {client.name}&apos;s details.</DialogDescription>
        </DialogHeader>
        <ToastForm<null>
          className="space-y-4"
          action={async (prev, fd) => {
            const res = await action(prev, fd);
            if (res.ok) setOpen(false);
            return res;
          }}
          successMessage="Client updated"
        >
          <div className="space-y-2">
            <Label htmlFor={`name-${client.id}`}>Name</Label>
            <Input id={`name-${client.id}`} name="name" required defaultValue={client.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`email-${client.id}`}>Email</Label>
            <Input
              id={`email-${client.id}`}
              name="email"
              type="email"
              defaultValue={client.email ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`addressLines-${client.id}`}>Address</Label>
            <Textarea
              id={`addressLines-${client.id}`}
              name="addressLines"
              rows={2}
              defaultValue={client.addressLines.join("\n")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`taxId-${client.id}`}>Tax ID</Label>
            <Input id={`taxId-${client.id}`} name="taxId" defaultValue={client.taxId ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`notes-${client.id}`}>Notes</Label>
            <Textarea
              id={`notes-${client.id}`}
              name="notes"
              rows={2}
              defaultValue={client.notes ?? ""}
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
