import Link from "next/link";
import { UserPlus } from "lucide-react";
import { listEmployees, createEmployee } from "@/lib/actions/employees";
import type { Result } from "@/lib/result";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { AddEmployeeDialog } from "@/components/add-employee-dialog";
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

  const managers = employees
    .filter((e) => e.status !== "TERMINATED")
    .map((e) => ({ id: e.id, firstName: e.firstName, lastName: e.lastName }));

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Employees" description="Directory, onboarding, and records." />
        <AddEmployeeDialog action={add} managers={managers} />
      </div>

      {employees.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No employees yet"
          description="Click 'New employee' to start building your directory."
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
                  <TableCell className="text-muted-foreground">
                    {e.title ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.department ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.manager
                      ? `${e.manager.firstName} ${e.manager.lastName}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.startDate.toISOString().slice(0, 10)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {statusLabels[e.status] ?? e.status}
                    </Badge>
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
