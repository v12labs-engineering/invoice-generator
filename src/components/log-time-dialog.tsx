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

export function LogTimeDialog({
  action,
  defaultDate,
  projectHourlyRateCents,
}: {
  action: (
    prev: Result<{ id: string }> | null,
    fd: FormData,
  ) => Promise<Result<{ id: string }>>;
  defaultDate: string;
  projectHourlyRateCents: number | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Log time
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log time</DialogTitle>
          <DialogDescription>
            Record work done on this project.
          </DialogDescription>
        </DialogHeader>
        <ToastForm<{ id: string }>
          className="space-y-4"
          action={async (prev, fd) => {
            const res = await action(prev, fd);
            if (res.ok) setOpen(false);
            return res;
          }}
          successMessage="Time logged"
        >
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" defaultValue={defaultDate} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minutes">Minutes</Label>
            <Input
              id="minutes"
              name="minutes"
              type="number"
              min={1}
              placeholder="e.g. 90"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">What did you do?</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              placeholder="Brief summary of the work"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hourlyRate">
              Hourly rate override (cents)
              {projectHourlyRateCents
                ? ` — default ${(projectHourlyRateCents / 100).toFixed(2)}`
                : ""}
            </Label>
            <Input
              id="hourlyRate"
              name="hourlyRate"
              type="number"
              min={0}
              placeholder="Leave blank to use project rate"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="billable"
              name="billable"
              type="checkbox"
              defaultChecked
              className="size-4 rounded border-input"
            />
            <Label htmlFor="billable" className="font-normal">
              Billable
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <FormSubmitButton>Log time</FormSubmitButton>
          </DialogFooter>
        </ToastForm>
      </DialogContent>
    </Dialog>
  );
}
