import Link from "next/link";
import { Briefcase } from "lucide-react";
import { listProjects, createProject } from "@/lib/actions/projects";
import { listClients } from "@/lib/actions/clients";
import type { Result } from "@/lib/result";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { AddProjectDialog } from "@/components/add-project-dialog";
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
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export default async function ProjectsPage() {
  const [projects, clients] = await Promise.all([listProjects(), listClients()]);

  async function add(_prev: Result<{ id: string }> | null, formData: FormData) {
    "use server";
    return createProject({
      name: formData.get("name"),
      description: formData.get("description"),
      clientId: formData.get("clientId"),
      status: formData.get("status") || "ACTIVE",
      hourlyRate: formData.get("hourlyRate"),
      currency: formData.get("currency") || "USD",
      budgetAmount: formData.get("budgetAmount"),
      budgetHours: formData.get("budgetHours"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
    });
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Projects" description="Track work, log time, and bill clients." />
        <AddProjectDialog
          action={add}
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No projects yet"
          description="Click 'New project' to start tracking time."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="px-4">Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="px-4 font-medium">
                    <Link href={`/projects/${p.id}`} className="hover:underline">
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.client?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {statusLabels[p.status] ?? p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {p.hourlyRate
                      ? `${(p.hourlyRate / 100).toFixed(2)} ${p.currency}/h`
                      : "—"}
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
