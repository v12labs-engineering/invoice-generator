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

export function RequestTimeOffDialog({
  action,
  employees,
}: {
  action: (
    prev: Result<{ id: string }> | null,
    fd: FormData,
  ) => Promise<Result<{ id: string }>>;
  employees: { id: string; firstName: string; lastName: string; ptoBalanceDays: number }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Request time off
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request time off</DialogTitle>
          <DialogDescription>Submit a new PTO request.</DialogDescription>
        </DialogHeader>
        <ToastForm<{ id: string }>
          className="space-y-4"
          action={async (prev, fd) => {
            const res = await action(prev, fd);
            if (res.ok) setOpen(false);
            return res;
          }}
          successMessage="Request submitted"
        >
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee</Label>
            <Select name="employeeId" required>
              <SelectTrigger id="employeeId" className="w-full">
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} ({e.ptoBalanceDays}d left)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select name="type" defaultValue="VACATION">
              <SelectTrigger id="type" className="w-full">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VACATION">Vacation</SelectItem>
                <SelectItem value="SICK">Sick</SelectItem>
                <SelectItem value="PERSONAL">Personal</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End</Label>
              <Input id="endDate" name="endDate" type="date" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              name="reason"
              rows={2}
              placeholder="Family event, conference, etc."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <FormSubmitButton>Submit request</FormSubmitButton>
          </DialogFooter>
        </ToastForm>
      </DialogContent>
    </Dialog>
  );
}
