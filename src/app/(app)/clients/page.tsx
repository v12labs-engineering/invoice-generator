import { Plus, Trash2, Users } from "lucide-react";
import { listClients, createClient, archiveClient } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { FormSubmitButton } from "@/components/form-submit-button";
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

export default async function ClientsPage() {
  const clients = await listClients();

  async function add(formData: FormData) {
    "use server";
    await createClient({
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
            <form action={add} className="space-y-4">
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
            </form>
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
            <div className="overflow-hidden rounded-lg border bg-card">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="px-4">Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="px-4 font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.email ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <form
                          action={async () => {
                            "use server";
                            await archiveClient(c.id);
                          }}
                        >
                          <Button variant="ghost" size="sm" type="submit">
                            <Trash2 className="size-3.5" />
                            Archive
                          </Button>
                        </form>
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
