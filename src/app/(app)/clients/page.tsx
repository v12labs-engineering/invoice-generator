import { Trash2, Users } from "lucide-react";
import {
  listClients,
  createClient,
  archiveClient,
  updateClient,
} from "@/lib/actions/clients";
import type { Result } from "@/lib/result";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ToastForm } from "@/components/toast-form";
import { ClientEditDialog } from "@/components/client-edit-dialog";
import { AddClientDialog } from "@/components/add-client-dialog";
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
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          title="Clients"
          description="Manage your customers and their billing details."
        />
        <AddClientDialog action={add} />
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Click 'New client' to add your first customer."
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
                  <TableCell className="text-muted-foreground">
                    {c.email ?? "—"}
                  </TableCell>
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
  );
}
