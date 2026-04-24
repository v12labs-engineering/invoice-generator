import { notFound } from "next/navigation";
import { getExpense } from "@/lib/actions/expenses";
import { listCategories } from "@/lib/actions/categories";
import { listSubscriptions } from "@/lib/actions/subscriptions";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseAttachments } from "@/components/expense-attachments";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [expense, categories, subscriptions] = await Promise.all([
    getExpense(id),
    listCategories(),
    listSubscriptions(),
  ]);

  if (!expense) notFound();

  const expenseForForm = {
    id: expense.id,
    description: expense.description,
    amount: expense.amount,
    date: expense.date,
    categoryId: expense.categoryId,
    subscriptionId: expense.subscriptionId,
    currency: expense.currency,
    paymentMethod: expense.paymentMethod,
    reference: expense.reference,
    notes: expense.notes,
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
      <PageHeader
        title={expense.description}
        description={expense.date.toISOString().slice(0, 10)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Expense details</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm expense={expenseForForm} categories={categories} subscriptions={subscriptions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
          <CardDescription>Upload receipts, invoices, or supporting documents.</CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseAttachments
            expenseId={expense.id}
            initialAttachments={expense.attachments.map((a) => ({
              id: a.id,
              fileName: a.fileName,
              fileUrl: a.fileUrl,
              fileType: a.fileType,
              fileSize: a.fileSize,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
