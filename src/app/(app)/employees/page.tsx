import Link from "next/link";
import { Plus, UserPlus } from "lucide-react";
import { listEmployees, createEmployee } from "@/lib/actions/employees";
import type { Result } from "@/lib/result";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ToastForm } from "@/components/toast-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const statusLabels: Record<string, string> = {
  ACTIVE: "Active",
  ONBOARDING: "Onboarding",
  ON_LEAVE: "On leave",
  TERMINATED: "Terminated",
};

export default async function EmployeesPage() {
  const employees = await listEmployees();

  async function add(_prev: Result<{ id: string }> | null, formData: FormData) {
    "use server";
    return createEmployee({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      title: formData.get("title"),
      department: formData.get("department"),
      employmentType: formData.get("employmentType") || "FULL_TIME",
      status: "ONBOARDING",
      startDate: formData.get("startDate"),
      salaryAmount: formData.get("salaryAmount"),
      salaryCurrency: formData.get("salaryCurrency") || "USD",
      ptoBalanceDays: formData.get("ptoBalanceDays") || 0,
      managerId: formData.get("managerId"),
    });
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
      <PageHeader title="Employees" description="Directory, onboarding, and records." />

      <Card>
        <CardHeader>
          <CardTitle>Add employee</CardTitle>
          <CardDescription>Creates an onboarding checklist automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <ToastForm<{ id: string }>
            className="grid gap-3 md:grid-cols-3 lg:grid-cols-6"
            action={add}
            successMessage="Employee added"
          >
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" name="department" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employmentType">Type</Label>
              <Select name="employmentType" defaultValue="FULL_TIME">
                <SelectTrigger id="employmentType" className="w-full h-11">
                  <SelectValue />
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
                <SelectTrigger id="managerId" className="w-full h-11">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((e) => e.status !== "TERMINATED")
                    .map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.firstName} {e.lastName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="salaryAmount">Salary (cents)</Label>
              <Input id="salaryAmount" name="salaryAmount" type="number" min={0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salaryCurrency">Currency</Label>
              <Input id="salaryCurrency" name="salaryCurrency" defaultValue="USD" maxLength={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptoBalanceDays">PTO days</Label>
              <Input id="ptoBalanceDays" name="ptoBalanceDays" type="number" min={0} defaultValue={15} />
            </div>
            <div className="md:col-span-6">
              <FormSubmitButton>
                <Plus className="size-4" />
                Add employee
              </FormSubmitButton>
            </div>
          </ToastForm>
        </CardContent>
      </Card>

      {employees.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No employees yet"
          description="Add your first team member to start building your directory."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="px-4">Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Start date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="px-4 font-medium">
                    <Link href={`/employees/${e.id}`} className="hover:underline">
                      {e.firstName} {e.lastName}
                    </Link>
                    <div className="text-xs text-muted-foreground">{e.email}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{e.title ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{e.department ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.manager ? `${e.manager.firstName} ${e.manager.lastName}` : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.startDate.toISOString().slice(0, 10)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{statusLabels[e.status] ?? e.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
