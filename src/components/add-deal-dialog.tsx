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

const STAGES = [
  { key: "LEAD", label: "Lead" },
  { key: "QUALIFIED", label: "Qualified" },
  { key: "PROPOSAL", label: "Proposal" },
  { key: "NEGOTIATION", label: "Negotiation" },
  { key: "WON", label: "Won" },
  { key: "LOST", label: "Lost" },
] as const;

export function AddDealDialog({
  action,
  clients,
  contacts,
}: {
  action: (
    prev: Result<{ id: string }> | null,
    fd: FormData,
  ) => Promise<Result<{ id: string }>>;
  clients: { id: string; name: string }[];
  contacts: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            New deal
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New deal</DialogTitle>
          <DialogDescription>Add an opportunity to your pipeline.</DialogDescription>
        </DialogHeader>
        <ToastForm<{ id: string }>
          className="grid gap-4 sm:grid-cols-2"
          action={async (prev, fd) => {
            const res = await action(prev, fd);
            if (res.ok) setOpen(false);
            return res;
          }}
          successMessage="Deal added"
        >
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Acme — Q2 retainer"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientId">Client</Label>
            <Select name="clientId" defaultValue="">
              <SelectTrigger id="clientId" className="w-full">
                <SelectValue placeholder="Select a client" />
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
            <Label htmlFor="contactId">Contact</Label>
            <Select name="contactId" defaultValue="">
              <SelectTrigger id="contactId" className="w-full">
                <SelectValue placeholder="Select a contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">Value (cents)</Label>
            <Input id="value" name="value" type="number" min={0} placeholder="50000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="probability">Probability %</Label>
            <Input
              id="probability"
              name="probability"
              type="number"
              min={0}
              max={100}
              defaultValue={0}
              placeholder="0–100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              name="currency"
              defaultValue="USD"
              maxLength={3}
              placeholder="USD"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <Select name="stage" defaultValue="LEAD">
              <SelectTrigger id="stage" className="w-full">
                <SelectValue placeholder="Select a stage" />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="expectedAt">Expected close</Label>
            <Input id="expectedAt" name="expectedAt" type="date" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Decision criteria, key contacts, blockers"
            />
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <FormSubmitButton>Add deal</FormSubmitButton>
          </DialogFooter>
        </ToastForm>
      </DialogContent>
    </Dialog>
  );
}
