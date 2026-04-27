"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import type { Result } from "@/lib/result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function SendInvoiceDialog({
  action,
  defaultRecipient,
}: {
  action: (
    prev: Result<null> | null,
    fd: FormData,
  ) => Promise<Result<null>>;
  defaultRecipient: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="w-full justify-start">
            <Send className="size-4" />
            Email invoice
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Email invoice</DialogTitle>
          <DialogDescription>Send this invoice to your client.</DialogDescription>
        </DialogHeader>
        <ToastForm<null>
          className="space-y-4"
          action={async (prev, fd) => {
            const res = await action(prev, fd);
            if (res.ok) setOpen(false);
            return res;
          }}
          successMessage="Invoice sent"
        >
          <div className="space-y-2">
            <Label htmlFor="to">Recipient</Label>
            <Input
              id="to"
              name="to"
              type="email"
              required
              defaultValue={defaultRecipient}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Input
              id="message"
              name="message"
              placeholder="Hi — please find the invoice attached."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <FormSubmitButton>Send invoice</FormSubmitButton>
          </DialogFooter>
        </ToastForm>
      </DialogContent>
    </Dialog>
  );
}
