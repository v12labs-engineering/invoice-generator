import { listCategories } from "@/lib/actions/categories";
import { listSubscriptions } from "@/lib/actions/subscriptions";
import { ExpenseForm } from "@/components/expense-form";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewExpensePage() {
  const [categories, subscriptions] = await Promise.all([listCategories(), listSubscriptions()]);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
      <PageHeader title="New expense" description="Record a new business expense." />
      <Card>
        <CardHeader>
          <CardTitle>Expense details</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm categories={categories} subscriptions={subscriptions} />
        </CardContent>
      </Card>
    </div>
  );
}
