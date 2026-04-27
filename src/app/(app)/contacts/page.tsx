import { Trash2, UserCircle } from "lucide-react";
import {
  listContacts,
  createContact,
  archiveContact,
} from "@/lib/actions/contacts";
import { listClients } from "@/lib/actions/clients";
import type { Result } from "@/lib/result";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ToastForm } from "@/components/toast-form";
import { AddContactDialog } from "@/components/add-contact-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default async function ContactsPage() {
  const [contacts, clients] = await Promise.all([listContacts(), listClients()]);

  async function add(_prev: Result<{ id: string }> | null, formData: FormData) {
    "use server";
    return createContact({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      title: formData.get("title"),
      clientId: formData.get("clientId"),
      notes: formData.get("notes"),
    });
  }

  async function archive(id: string, _prev: Result<null> | null, _fd: FormData) {
    "use server";
    return archiveContact(id);
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Contacts" description="People you do business with." />
        <AddContactDialog
          action={add}
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>

      {contacts.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title="No contacts yet"
          description="Click 'New contact' to add your first contact."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="px-4">Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="px-4 font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.title ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.client?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <ToastForm<null>
                      action={archive.bind(null, c.id)}
                      successMessage="Archived"
                    >
                      <Button variant="ghost" size="sm" type="submit">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </ToastForm>
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
