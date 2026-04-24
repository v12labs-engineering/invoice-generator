import { Package, Plus, Trash2 } from "lucide-react";
import { listProducts, createProduct, archiveProduct } from "@/lib/actions/products";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default async function ProductsPage() {
  const products = await listProducts();

  async function add(formData: FormData) {
    "use server";
    await createProduct({
      name: formData.get("name"),
      description: formData.get("description"),
      unitPrice: Math.round(Number(formData.get("unitPrice")) * 100),
      currency: String(formData.get("currency") ?? "USD"),
      defaultTaxRate: Number(formData.get("defaultTaxRate") ?? 0),
    });
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
      <PageHeader
        title="Products & Services"
        description="Reusable catalog items you can add to invoices."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Add item</CardTitle>
            <CardDescription>Save a product or service for reuse.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={add} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit price</Label>
                  <Input id="unitPrice" name="unitPrice" type="number" step="0.01" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" name="currency" defaultValue="USD" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultTaxRate">Tax (bps)</Label>
                  <Input id="defaultTaxRate" name="defaultTaxRate" type="number" defaultValue={0} />
                </div>
              </div>
              <FormSubmitButton>
                <Plus className="size-4" />
                Add item
              </FormSubmitButton>
            </form>
          </CardContent>
        </Card>

        <div>
          {products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No items yet"
              description="Add reusable line items for faster invoicing."
            />
          ) : (
            <div className="overflow-hidden rounded-lg border bg-card">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="px-4">Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="px-4 font-medium">{p.name}</TableCell>
                      <TableCell>{formatMoney(p.unitPrice, p.currency)}</TableCell>
                      <TableCell className="text-right">
                        <form
                          action={async () => {
                            "use server";
                            await archiveProduct(p.id);
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
