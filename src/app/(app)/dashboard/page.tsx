import { AlertCircle, CircleDollarSign, TrendingUp } from "lucide-react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/actions/_shared";
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
  const userId = await requireUserId();

  const [outstanding, paidThisMonth, overdue, profile] = await Promise.all([
    db.invoice.aggregate({
      where: { userId, status: { in: ["SENT", "PARTIAL"] } },
      _sum: { balance: true },
    }),
    db.payment.aggregate({
      where: {
        invoice: { userId },
        paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { amount: true },
    }),
    db.invoice.count({
      where: { userId, status: { in: ["SENT", "PARTIAL"] }, dueDate: { lt: new Date() } },
    }),
    db.businessProfile.findUnique({ where: { userId } }),
  ]);

  const currency = profile?.defaultCurrency ?? "USD";

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <PageHeader title="Dashboard" description="Overview of your invoicing activity." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi
          label="Outstanding"
          value={formatMoney(outstanding._sum.balance ?? 0, currency)}
          description="Unpaid balance across sent invoices"
          icon={CircleDollarSign}
        />
        <Kpi
          label="Paid this month"
          value={formatMoney(paidThisMonth._sum.amount ?? 0, currency)}
          description="Total collected since the 1st"
          icon={TrendingUp}
        />
        <Kpi
          label="Overdue"
          value={String(overdue)}
          description={overdue === 0 ? "No overdue invoices" : "Invoices past due date"}
          icon={AlertCircle}
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
