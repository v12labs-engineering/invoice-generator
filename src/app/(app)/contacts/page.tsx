import { Plus, Trash2, UserCircle } from "lucide-react";
import {
  listContacts,
  createContact,
  archiveContact,
} from "@/lib/actions/contacts";
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
      <PageHeader title="Contacts" description="People you do business with." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Add contact</CardTitle>
            <CardDescription>Record a new person at a client company.</CardDescription>
          </CardHeader>
          <CardContent>
            <ToastForm<{ id: string }>
              className="space-y-4"
              action={add}
              successMessage="Contact added"
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
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" placeholder="CEO, CFO, etc." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientId">Company</Label>
                <Select name="clientId" defaultValue="">
                  <SelectTrigger id="clientId" className="w-full">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={2} />
              </div>
              <FormSubmitButton>
                <Plus className="size-4" />
                Add contact
              </FormSubmitButton>
            </ToastForm>
          </CardContent>
        </Card>

        <div>
          {contacts.length === 0 ? (
            <EmptyState
              icon={UserCircle}
              title="No contacts yet"
              description="Add contacts to keep track of who you talk to at each company."
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
                      <TableCell className="text-muted-foreground">{c.title ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.client?.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.email ?? "—"}</TableCell>
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
      </div>
    </div>
  );
}
