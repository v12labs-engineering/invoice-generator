import Link from "next/link";
import { Briefcase, Plus } from "lucide-react";
import { listProjects, createProject } from "@/lib/actions/projects";
import { listClients } from "@/lib/actions/clients";
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
      <PageHeader title="Projects" description="Track work, log time, and bill clients." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>New project</CardTitle>
            <CardDescription>Create a project to track time against.</CardDescription>
          </CardHeader>
          <CardContent>
            <ToastForm<{ id: string }>
              className="space-y-4"
              action={add}
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
              <FormSubmitButton>
                <Plus className="size-4" />
                Create project
              </FormSubmitButton>
            </ToastForm>
          </CardContent>
        </Card>

        <div>
          {projects.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No projects yet"
              description="Create your first project to start tracking time."
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
                        <Badge variant="secondary">{statusLabels[p.status] ?? p.status}</Badge>
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
      </div>
    </div>
  );
}
