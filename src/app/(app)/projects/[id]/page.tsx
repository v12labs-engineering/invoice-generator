import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Clock, FileText, Trash2 } from "lucide-react";
import {
  getProject,
  createTimeEntry,
  deleteTimeEntry,
  invoiceProjectTime,
} from "@/lib/actions/projects";
import type { Result } from "@/lib/result";
import { PageHeader } from "@/components/page-header";
import { ToastForm } from "@/components/toast-form";
import { LogTimeDialog } from "@/components/log-time-dialog";
import {
  Card,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  async function logTime(_prev: Result<{ id: string }> | null, formData: FormData) {
    "use server";
    return createTimeEntry({
      projectId: id,
      date: formData.get("date"),
      minutes: formData.get("minutes"),
      description: formData.get("description"),
      billable: formData.get("billable"),
      hourlyRate: formData.get("hourlyRate"),
    });
  }

  async function removeEntry(entryId: string, _prev: Result<null> | null, _fd: FormData) {
    "use server";
    return deleteTimeEntry(entryId);
  }

  async function generateInvoice() {
    "use server";
    const res = await invoiceProjectTime(id);
    if (res.ok) redirect(`/invoices/${res.data.invoiceId}`);
    return res;
  }

  const totalMinutes = project.timeEntries.reduce((s, e) => s + e.minutes, 0);
  const billableMinutes = project.timeEntries
    .filter((e) => e.billable)
    .reduce((s, e) => s + e.minutes, 0);
  const uninvoicedMinutes = project.timeEntries
    .filter((e) => e.billable && !e.invoiceLineId)
    .reduce((s, e) => s + e.minutes, 0);
  const uninvoicedValue = project.timeEntries
    .filter((e) => e.billable && !e.invoiceLineId)
    .reduce((s, e) => {
      const rate = e.hourlyRate ?? project.hourlyRate ?? 0;
      return s + Math.round((rate * e.minutes) / 60);
    }, 0);

  const fmtHours = (m: number) => `${(m / 60).toFixed(1)}h`;
  const today = new Date().toISOString().slice(0, 10);
  const canInvoice =
    Boolean(project.clientId) && uninvoicedMinutes > 0 && (project.hourlyRate ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          title={project.name}
          description={project.client?.name ?? "Internal project"}
        />
        <div className="flex items-center gap-2">
          <ToastForm<{ invoiceId: string }>
            action={async (_prev, _fd) => {
              "use server";
              return generateInvoice();
            }}
            successMessage="Invoice created"
          >
            <Button type="submit" variant="outline" disabled={!canInvoice}>
              <FileText className="size-4" />
              Invoice uninvoiced time
            </Button>
          </ToastForm>
          <LogTimeDialog
            action={logTime}
            defaultDate={today}
            projectHourlyRateCents={project.hourlyRate}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total tracked</CardDescription>
            <CardTitle className="text-2xl">{fmtHours(totalMinutes)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Billable</CardDescription>
            <CardTitle className="text-2xl">{fmtHours(billableMinutes)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Uninvoiced hours</CardDescription>
            <CardTitle className="text-2xl">{fmtHours(uninvoicedMinutes)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Uninvoiced value</CardDescription>
            <CardTitle className="text-2xl">
              {formatMoney(uninvoicedValue, project.currency)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {project.timeEntries.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          <Clock className="mx-auto mb-2 size-8 opacity-50" />
          No time logged yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="px-4">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.timeEntries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="px-4 whitespace-nowrap">
                    {e.date.toISOString().slice(0, 10)}
                  </TableCell>
                  <TableCell>
                    <div>{e.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.user.email}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fmtHours(e.minutes)}
                  </TableCell>
                  <TableCell>
                    {e.invoiceLineId ? (
                      <Badge variant="secondary">Invoiced</Badge>
                    ) : e.billable ? (
                      <Badge>Billable</Badge>
                    ) : (
                      <Badge variant="outline">Non-billable</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!e.invoiceLineId && (
                      <ToastForm<null>
                        action={removeEntry.bind(null, e.id)}
                        successMessage="Deleted"
                      >
                        <Button variant="ghost" size="sm" type="submit">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </ToastForm>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!project.clientId && (
        <p className="text-xs text-muted-foreground">
          Assign a client to this project to enable invoicing.
        </p>
      )}
      {project.clientId && !project.hourlyRate && (
        <p className="text-xs text-muted-foreground">
          Set an hourly rate on this project (or per entry) to enable invoicing.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        <Link href="/projects" className="hover:underline">
          ← Back to all projects
        </Link>
      </p>
    </div>
  );
}
