import { db } from "@/lib/db";
import { requireUserId } from "@/lib/actions/_shared";
import { formatMoney } from "@/lib/money";

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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <Card label="Outstanding" value={formatMoney(outstanding._sum.balance ?? 0, currency)} />
        <Card label="Paid this month" value={formatMoney(paidThisMonth._sum.amount ?? 0, currency)} />
        <Card label="Overdue" value={String(overdue)} />
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border p-6">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
