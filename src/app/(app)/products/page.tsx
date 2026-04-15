import { listProducts, createProduct, archiveProduct } from "@/lib/actions/products";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Products & Services</h1>

      <form action={add} className="max-w-md space-y-3 rounded-lg border p-6">
        <div className="space-y-1">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="unitPrice">Unit price</Label>
            <Input id="unitPrice" name="unitPrice" type="number" step="0.01" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" name="currency" defaultValue="USD" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="defaultTaxRate">Tax (bps)</Label>
            <Input id="defaultTaxRate" name="defaultTaxRate" type="number" defaultValue={0} />
          </div>
        </div>
        <Button type="submit">Add product</Button>
      </form>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Price</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="p-3">{p.name}</td>
                <td className="p-3">{formatMoney(p.unitPrice, p.currency)}</td>
                <td className="p-3 text-right">
                  <form
                    action={async () => {
                      "use server";
                      await archiveProduct(p.id);
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
