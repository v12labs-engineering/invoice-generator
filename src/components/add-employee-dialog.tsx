"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Result } from "@/lib/result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function AddEmployeeDialog({
  action,
  managers,
}: {
  action: (
    prev: Result<{ id: string }> | null,
    fd: FormData,
  ) => Promise<Result<{ id: string }>>;
  managers: { id: string; firstName: string; lastName: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            New employee
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add employee</DialogTitle>
          <DialogDescription>
            Creates an onboarding checklist automatically.
          </DialogDescription>
        </DialogHeader>
        <ToastForm<{ id: string }>
          className="grid gap-4 sm:grid-cols-2"
          action={async (prev, fd) => {
            const res = await action(prev, fd);
            if (res.ok) setOpen(false);
            return res;
          }}
          successMessage="Employee added"
        >
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" name="firstName" placeholder="Jane" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" name="lastName" placeholder="Doe" required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jane.doe@company.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" placeholder="+1 555 123 4567" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="e.g. Senior Engineer" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              name="department"
              placeholder="e.g. Engineering"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employmentType">Type</Label>
            <Select name="employmentType" defaultValue="FULL_TIME">
              <SelectTrigger id="employmentType" className="w-full">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FULL_TIME">Full-time</SelectItem>
                <SelectItem value="PART_TIME">Part-time</SelectItem>
                <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                <SelectItem value="INTERN">Intern</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Start date</Label>
            <Input id="startDate" name="startDate" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="managerId">Manager</Label>
            <Select name="managerId" defaultValue="">
              <SelectTrigger id="managerId" className="w-full">
                <SelectValue placeholder="Select a manager" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="salaryAmount">Salary (cents)</Label>
            <Input
              id="salaryAmount"
              name="salaryAmount"
              type="number"
              min={0}
              placeholder="100000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salaryCurrency">Currency</Label>
            <Input
              id="salaryCurrency"
              name="salaryCurrency"
              defaultValue="USD"
              maxLength={3}
              placeholder="USD"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ptoBalanceDays">PTO days</Label>
            <Input
              id="ptoBalanceDays"
              name="ptoBalanceDays"
              type="number"
              min={0}
              defaultValue={15}
              placeholder="15"
            />
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <FormSubmitButton>Add employee</FormSubmitButton>
          </DialogFooter>
        </ToastForm>
      </DialogContent>
    </Dialog>
  );
}
