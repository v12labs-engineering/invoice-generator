import { listCategories } from "@/lib/actions/categories";
import { listVendors } from "@/lib/actions/vendors";
import { ExpenseForm } from "@/components/expense-form";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewExpensePage() {
  const [categories, vendors] = await Promise.all([listCategories(), listVendors()]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 lg:p-8">
      <PageHeader title="New expense" description="Record a new business expense." />
      <Card>
        <CardHeader>
          <CardTitle>Expense details</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm categories={categories} vendors={vendors} />
        </CardContent>
      </Card>
    </div>
  );
}
