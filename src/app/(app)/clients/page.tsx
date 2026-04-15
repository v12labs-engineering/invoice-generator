import { listClients, createClient, archiveClient } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Clients</h1>

      <form action={add} className="max-w-md space-y-3 rounded-lg border p-6">
        <div className="space-y-1">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="addressLines">Address</Label>
          <Textarea id="addressLines" name="addressLines" rows={2} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="taxId">Tax ID</Label>
          <Input id="taxId" name="taxId" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={2} />
        </div>
        <Button type="submit">Add client</Button>
      </form>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="p-3">{c.name}</td>
                <td className="p-3 text-muted-foreground">{c.email ?? "—"}</td>
                <td className="p-3 text-right">
                  <form
                    action={async () => {
                      "use server";
                      await archiveClient(c.id);
                    }}
                  >
                    <Button variant="ghost" size="sm" type="submit">
                      Archive
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
