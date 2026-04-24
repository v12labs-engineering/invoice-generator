import { AlertCircle, CircleDollarSign, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { db } from "@/lib/db";
import { requireMembership } from "@/lib/actions/_shared";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const { businessId } = await requireMembership();

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [outstanding, paidThisMonth, overdue, business, expensesThisMonth] = await Promise.all([
    db.invoice.aggregate({
      where: { businessId, status: { in: ["SENT", "PARTIAL"] } },
      _sum: { balance: true },
    }),
    db.payment.aggregate({
      where: {
        invoice: { businessId },
        paidAt: { gte: monthStart },
      },
      _sum: { amount: true },
    }),
    db.invoice.count({
      where: { businessId, status: { in: ["SENT", "PARTIAL"] }, dueDate: { lt: new Date() } },
    }),
    db.business.findUnique({ where: { id: businessId } }),
    db.expense.aggregate({
      where: { businessId, date: { gte: monthStart } },
      _sum: { amount: true },
    }),
  ]);

  const currency = business?.defaultCurrency ?? "USD";
  const paid = paidThisMonth._sum.amount ?? 0;
  const expenses = expensesThisMonth._sum.amount ?? 0;
  const net = paid - expenses;

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
      <PageHeader title="Dashboard" description="Overview of your business finances." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi
          label="Outstanding"
          value={formatMoney(outstanding._sum.balance ?? 0, currency)}
          description="Unpaid balance across sent invoices"
          icon={CircleDollarSign}
        />
        <Kpi
          label="Paid this month"
          value={formatMoney(paid, currency)}
          description="Total collected since the 1st"
          icon={TrendingUp}
        />
        <Kpi
          label="Overdue"
          value={String(overdue)}
          description={overdue === 0 ? "No overdue invoices" : "Invoices past due date"}
          icon={AlertCircle}
        />
        <Kpi
          label="Expenses this month"
          value={formatMoney(expenses, currency)}
          description="Total expenses recorded since the 1st"
          icon={TrendingDown}
        />
        <Kpi
          label="Net this month"
          value={formatMoney(net, currency)}
          description="Collected minus expenses this month"
          icon={Wallet}
        />
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: ComponentType<LucideProps>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tracking-tight">{value}</CardTitle>
        <CardAction>
          <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
