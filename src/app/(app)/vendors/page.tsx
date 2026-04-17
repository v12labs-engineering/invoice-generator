import { Plus, Trash2, Store } from "lucide-react";
import {
  listVendors,
  createVendor,
  archiveVendor,
  updateVendor,
} from "@/lib/actions/vendors";
import { db } from "@/lib/db";
import { requireMembership } from "@/lib/actions/_shared";
import { formatMoney } from "@/lib/money";
import type { Result } from "@/lib/result";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ToastForm } from "@/components/toast-form";
import { VendorEditDialog } from "@/components/vendor-edit-dialog";
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

export default async function VendorsPage() {
  const [vendors, { businessId }] = await Promise.all([listVendors(), requireMembership()]);
  const business = await db.business.findUnique({ where: { id: businessId } });
  const currency = business?.defaultCurrency ?? "USD";

  const rawStats = await db.expense.groupBy({
    by: ["vendorId"],
    where: { businessId, vendorId: { not: null } },
    _count: true,
    _sum: { amount: true },
  });
  const statsMap = new Map(rawStats.map((s) => [s.vendorId!, s]));

  async function add(_prev: Result<{ id: string }> | null, formData: FormData) {
    "use server";
    return createVendor({
      name: formData.get("name"),
      email: formData.get("email"),
      addressLines: String(formData.get("addressLines") ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      notes: formData.get("notes"),
    });
  }

  async function edit(id: string, _prev: Result<null> | null, formData: FormData) {
    "use server";
    return updateVendor(id, {
      name: formData.get("name"),
      email: formData.get("email"),
      addressLines: String(formData.get("addressLines") ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      notes: formData.get("notes"),
    });
  }

  async function archive(id: string, _prev: Result<null> | null, _fd: FormData) {
    "use server";
    return archiveVendor(id);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <PageHeader title="Vendors" description="Manage your suppliers and service providers." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Add vendor</CardTitle>
            <CardDescription>Create a new vendor record.</CardDescription>
          </CardHeader>
          <CardContent>
            <ToastForm<{ id: string }>
              className="space-y-4"
              action={add}
              successMessage="Vendor added"
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
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={2} />
              </div>
              <FormSubmitButton>
                <Plus className="size-4" />
                Add vendor
              </FormSubmitButton>
            </ToastForm>
          </CardContent>
        </Card>

        <div>
          {vendors.length === 0 ? (
            <EmptyState
              icon={Store}
              title="No vendors yet"
              description="Add your first vendor using the form on the left."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="px-4">Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Total spent</TableHead>
                    <TableHead className="w-40" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((v) => {
                    const stats = statsMap.get(v.id);
                    return (
                    <TableRow key={v.id}>
                      <TableCell className="px-4 font-medium">{v.name}</TableCell>
                      <TableCell className="text-muted-foreground">{v.email ?? "—"}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {stats?._count ?? 0}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {stats?._sum.amount != null
                          ? formatMoney(Number(stats._sum.amount), currency)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <VendorEditDialog
                            vendor={{
                              id: v.id,
                              name: v.name,
                              email: v.email,
                              addressLines: v.addressLines,
                              notes: v.notes,
                            }}
                            action={edit.bind(null, v.id)}
                          />
                          <ToastForm<null>
                            action={archive.bind(null, v.id)}
                            successMessage="Vendor archived"
                          >
                            <Button variant="ghost" size="sm" type="submit">
                              <Trash2 className="size-3.5" />
                              Archive
                            </Button>
                          </ToastForm>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
