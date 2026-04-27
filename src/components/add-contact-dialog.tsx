"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Result } from "@/lib/result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function AddContactDialog({
  action,
  clients,
}: {
  action: (
    prev: Result<{ id: string }> | null,
    fd: FormData,
  ) => Promise<Result<{ id: string }>>;
  clients: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            New contact
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add contact</DialogTitle>
          <DialogDescription>
            Record a new person at a client company.
          </DialogDescription>
        </DialogHeader>
        <ToastForm<{ id: string }>
          className="space-y-4"
          action={async (prev, fd) => {
            const res = await action(prev, fd);
            if (res.ok) setOpen(false);
            return res;
          }}
          successMessage="Contact added"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Jane Doe" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jane@acme.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" placeholder="+1 555 123 4567" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="CEO, CFO, etc." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientId">Company</Label>
            <Select name="clientId" defaultValue="">
              <SelectTrigger id="clientId" className="w-full">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="How you met, preferences, etc."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <FormSubmitButton>Add contact</FormSubmitButton>
          </DialogFooter>
        </ToastForm>
      </DialogContent>
    </Dialog>
  );
}
