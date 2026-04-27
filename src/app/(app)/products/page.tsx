import { Package, Trash2 } from "lucide-react";
import { listProducts, createProduct, archiveProduct } from "@/lib/actions/products";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { AddProductDialog } from "@/components/add-product-dialog";
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
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          title="Products & Services"
          description="Reusable catalog items you can add to invoices."
        />
        <AddProductDialog action={add} />
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No items yet"
          description="Click 'New item' to add reusable line items for faster invoicing."
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
  );
}
