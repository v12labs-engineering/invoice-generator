import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, FileSignature, Plus, Trash2 } from "lucide-react";
import {
  getEmployee,
  toggleOnboardingTask,
  addOnboardingTask,
  deleteOnboardingTask,
  terminateEmployee,
} from "@/lib/actions/employees";
import type { Result } from "@/lib/result";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ToastForm } from "@/components/toast-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await getEmployee(id);
  if (!employee) notFound();

  async function toggle(taskId: string, _prev: Result<null> | null, _fd: FormData) {
    "use server";
    return toggleOnboardingTask(taskId);
  }

  async function addTask(_prev: Result<{ id: string }> | null, formData: FormData) {
    "use server";
    return addOnboardingTask({
      employeeId: id,
      title: formData.get("title"),
      description: formData.get("description"),
    });
  }

  async function removeTask(taskId: string, _prev: Result<null> | null, _fd: FormData) {
    "use server";
    return deleteOnboardingTask(taskId);
  }

  async function terminate(_prev: Result<null> | null, _fd: FormData) {
    "use server";
    return terminateEmployee(id);
  }

  const done = employee.onboardingTasks.filter((t) => t.completedAt).length;
  const total = employee.onboardingTasks.length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title={`${employee.firstName} ${employee.lastName}`}
          description={`${employee.title ?? "—"} · ${employee.department ?? "No department"}`}
        />
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{employee.status}</Badge>
          <Link
            href={`/employees/${employee.id}/generate-doc`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <FileSignature className="size-4" />
            Generate document
          </Link>
          {employee.status !== "TERMINATED" && (
            <ToastForm<null> action={terminate} successMessage="Terminated">
              <Button type="submit" variant="ghost" size="sm">
                Terminate
              </Button>
            </ToastForm>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Employment</CardDescription>
            <CardTitle className="text-base">{employee.employmentType.replace("_", "-")}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Manager</CardDescription>
            <CardTitle className="text-base">
              {employee.manager
                ? `${employee.manager.firstName} ${employee.manager.lastName}`
                : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>PTO balance</CardDescription>
            <CardTitle className="text-base">{employee.ptoBalanceDays} days</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Salary</CardDescription>
            <CardTitle className="text-base">
              {employee.salaryAmount
                ? formatMoney(employee.salaryAmount, employee.salaryCurrency)
                : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Onboarding</CardTitle>
          <CardDescription>
            {done} of {total} complete
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {employee.onboardingTasks.length === 0 && (
            <p className="text-sm text-muted-foreground">No tasks yet.</p>
          )}
          {employee.onboardingTasks.map((t) => {
            const completed = Boolean(t.completedAt);
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-md border bg-card p-3"
              >
                <ToastForm<null> action={toggle.bind(null, t.id)}>
                  <button
                    type="submit"
                    className="flex size-6 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={completed ? "Mark incomplete" : "Mark complete"}
                  >
                    {completed ? (
                      <CheckCircle2 className="size-5 text-primary" />
                    ) : (
                      <Circle className="size-5" />
                    )}
                  </button>
                </ToastForm>
                <div className={`flex-1 text-sm ${completed ? "line-through text-muted-foreground" : ""}`}>
                  {t.title}
                  {t.description && (
                    <div className="text-xs text-muted-foreground">{t.description}</div>
                  )}
                </div>
                <ToastForm<null> action={removeTask.bind(null, t.id)} successMessage="Removed">
                  <Button type="submit" variant="ghost" size="sm">
                    <Trash2 className="size-3.5" />
                  </Button>
                </ToastForm>
              </div>
            );
          })}

          <ToastForm<{ id: string }>
            className="flex items-end gap-2"
            action={addTask}
            successMessage="Task added"
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="title">New task</Label>
              <Input id="title" name="title" placeholder="e.g. Sign NDA" required />
            </div>
            <FormSubmitButton size="sm">
              <Plus className="size-3.5" />
              Add
            </FormSubmitButton>
          </ToastForm>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Time off history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {employee.timeOffRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requests.</p>
            ) : (
              employee.timeOffRequests.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-md border p-2 text-sm"
                >
                  <div>
                    <div className="font-medium">{r.type}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.startDate.toISOString().slice(0, 10)} →{" "}
                      {r.endDate.toISOString().slice(0, 10)} · {r.days}d
                    </div>
                  </div>
                  <Badge variant="secondary">{r.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {employee.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No documents.{" "}
                <Link href="/documents" className="underline">
                  Upload one
                </Link>
                .
              </p>
            ) : (
              employee.documents.map((d) => (
                <a
                  key={d.id}
                  href={d.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-md border p-2 text-sm hover:bg-muted/40"
                >
                  <div className="font-medium">{d.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.category} · {d.fileName}
                  </div>
                </a>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        <Link href="/employees" className="hover:underline">
          ← Back to all employees
        </Link>
      </p>
    </div>
  );
}
