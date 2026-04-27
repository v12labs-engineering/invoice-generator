"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
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

export type EditableEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  title: string | null;
  department: string | null;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACTOR" | "INTERN";
  status: "ACTIVE" | "ONBOARDING" | "ON_LEAVE" | "TERMINATED";
  startDate: Date;
  endDate: Date | null;
  salaryAmount: number | null;
  salaryCurrency: string;
  ptoBalanceDays: number;
  managerId: string | null;
  notes: string | null;
};

export function EditEmployeeDialog({
  employee,
  managers,
  action,
}: {
  employee: EditableEmployee;
  managers: { id: string; firstName: string; lastName: string }[];
  action: (
    prev: Result<null> | null,
    fd: FormData,
  ) => Promise<Result<null>>;
}) {
  const [open, setOpen] = useState(false);
  const dateStr = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Pencil className="size-3.5" />
            Edit
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit employee</DialogTitle>
          <DialogDescription>
            Update {employee.firstName} {employee.lastName}&apos;s details.
          </DialogDescription>
        </DialogHeader>
        <ToastForm<null>
          className="grid gap-4 sm:grid-cols-2"
          action={async (prev, fd) => {
            const res = await action(prev, fd);
            if (res.ok) setOpen(false);
            return res;
          }}
          successMessage="Employee updated"
        >
          <div className="space-y-2">
            <Label htmlFor={`firstName-${employee.id}`}>First name</Label>
            <Input
              id={`firstName-${employee.id}`}
              name="firstName"
              defaultValue={employee.firstName}
              placeholder="Jane"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`lastName-${employee.id}`}>Last name</Label>
            <Input
              id={`lastName-${employee.id}`}
              name="lastName"
              defaultValue={employee.lastName}
              placeholder="Doe"
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`email-${employee.id}`}>Email</Label>
            <Input
              id={`email-${employee.id}`}
              name="email"
              type="email"
              defaultValue={employee.email}
              placeholder="jane.doe@company.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`phone-${employee.id}`}>Phone</Label>
            <Input
              id={`phone-${employee.id}`}
              name="phone"
              defaultValue={employee.phone ?? ""}
              placeholder="+1 555 123 4567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`title-${employee.id}`}>Title</Label>
            <Input
              id={`title-${employee.id}`}
              name="title"
              defaultValue={employee.title ?? ""}
              placeholder="e.g. Senior Engineer"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`department-${employee.id}`}>Department</Label>
            <Input
              id={`department-${employee.id}`}
              name="department"
              defaultValue={employee.department ?? ""}
              placeholder="e.g. Engineering"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`employmentType-${employee.id}`}>Type</Label>
            <Select name="employmentType" defaultValue={employee.employmentType}>
              <SelectTrigger
                id={`employmentType-${employee.id}`}
                className="w-full"
              >
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
            <Label htmlFor={`status-${employee.id}`}>Status</Label>
            <Select name="status" defaultValue={employee.status}>
              <SelectTrigger id={`status-${employee.id}`} className="w-full">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ONBOARDING">Onboarding</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ON_LEAVE">On leave</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`startDate-${employee.id}`}>Start date</Label>
            <Input
              id={`startDate-${employee.id}`}
              name="startDate"
              type="date"
              defaultValue={dateStr(employee.startDate)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`endDate-${employee.id}`}>End date</Label>
            <Input
              id={`endDate-${employee.id}`}
              name="endDate"
              type="date"
              defaultValue={dateStr(employee.endDate)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`managerId-${employee.id}`}>Manager</Label>
            <Select name="managerId" defaultValue={employee.managerId ?? ""}>
              <SelectTrigger id={`managerId-${employee.id}`} className="w-full">
                <SelectValue placeholder="Select a manager" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`salaryAmount-${employee.id}`}>Salary (cents)</Label>
            <Input
              id={`salaryAmount-${employee.id}`}
              name="salaryAmount"
              type="number"
              min={0}
              defaultValue={employee.salaryAmount ?? ""}
              placeholder="100000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`salaryCurrency-${employee.id}`}>Currency</Label>
            <Input
              id={`salaryCurrency-${employee.id}`}
              name="salaryCurrency"
              defaultValue={employee.salaryCurrency}
              maxLength={3}
              placeholder="USD"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`ptoBalanceDays-${employee.id}`}>PTO days</Label>
            <Input
              id={`ptoBalanceDays-${employee.id}`}
              name="ptoBalanceDays"
              type="number"
              min={0}
              defaultValue={employee.ptoBalanceDays}
              placeholder="15"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`notes-${employee.id}`}>Notes</Label>
            <Textarea
              id={`notes-${employee.id}`}
              name="notes"
              rows={2}
              defaultValue={employee.notes ?? ""}
              placeholder="Internal notes about this employee"
            />
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <FormSubmitButton>Save changes</FormSubmitButton>
          </DialogFooter>
        </ToastForm>
      </DialogContent>
    </Dialog>
  );
}
