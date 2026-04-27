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

export function AddProjectDialog({
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
            New project
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>Create a project to track time against.</DialogDescription>
        </DialogHeader>
        <ToastForm<{ id: string }>
          className="space-y-4"
          action={async (prev, fd) => {
            const res = await action(prev, fd);
            if (res.ok) setOpen(false);
            return res;
          }}
          successMessage="Project created"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Acme — Q2 redesign"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientId">Client</Label>
            <Select name="clientId" defaultValue="">
              <SelectTrigger id="clientId" className="w-full">
                <SelectValue placeholder="No client (internal)" />
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              placeholder="What's the project about?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly rate (cents)</Label>
              <Input
                id="hourlyRate"
                name="hourlyRate"
                type="number"
                min={0}
                placeholder="15000"
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start</Label>
              <Input id="startDate" name="startDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End</Label>
              <Input id="endDate" name="endDate" type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <FormSubmitButton>Create project</FormSubmitButton>
          </DialogFooter>
        </ToastForm>
      </DialogContent>
    </Dialog>
  );
}
