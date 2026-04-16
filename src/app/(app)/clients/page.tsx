import { Plus, Trash2, Users } from "lucide-react";
import {
  listClients,
  createClient,
  archiveClient,
  updateClient,
} from "@/lib/actions/clients";
import type { Result } from "@/lib/result";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ToastForm } from "@/components/toast-form";
import { ClientEditDialog } from "@/components/client-edit-dialog";
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
import { Button } from "@/components/ui/button";

export default async function ClientsPage() {
  const clients = await listClients();

  async function add(_prev: Result<{ id: string }> | null, formData: FormData) {
    "use server";
    return createClient({
      name: formData.get("name"),
      email: formData.get("email"),
      addressLines: String(formData.get("addressLines") ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      taxId: formData.get("taxId"),
      notes: formData.get("notes"),
    });
  }

  async function edit(id: string, _prev: Result<null> | null, formData: FormData) {
    "use server";
    return updateClient(id, {
      name: formData.get("name"),
      email: formData.get("email"),
      addressLines: String(formData.get("addressLines") ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      taxId: formData.get("taxId"),
      notes: formData.get("notes"),
    });
  }

  async function archive(id: string, _prev: Result<null> | null, _fd: FormData) {
    "use server";
    return archiveClient(id);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <PageHeader title="Clients" description="Manage your customers and their billing details." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Add client</CardTitle>
            <CardDescription>Create a new customer record.</CardDescription>
          </CardHeader>
          <CardContent>
            <ToastForm<{ id: string }>
              className="space-y-4"
              action={add}
              successMessage="Client added"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLines">Address</Label>
                <Textarea id="addressLines" name="addressLines" rows={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID</Label>
                <Input id="taxId" name="taxId" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={2} />
              </div>
              <FormSubmitButton>
                <Plus className="size-4" />
                Add client
              </FormSubmitButton>
            </ToastForm>
          </CardContent>
        </Card>

        <div>
          {clients.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No clients yet"
              description="Add your first client using the form on the left."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="px-4">Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-40" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="px-4 font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.email ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <ClientEditDialog
                            client={{
                              id: c.id,
                              name: c.name,
                              email: c.email,
                              addressLines: c.addressLines,
                              taxId: c.taxId,
                              notes: c.notes,
                            }}
                            action={edit.bind(null, c.id)}
                          />
                          <ToastForm<null>
                            action={archive.bind(null, c.id)}
                            successMessage="Client archived"
                          >
                            <Button variant="ghost" size="sm" type="submit">
                              <Trash2 className="size-3.5" />
                              Archive
                            </Button>
                          </ToastForm>
                        </div>
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
