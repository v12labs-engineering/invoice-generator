import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  Briefcase,
  CalendarClock,
  CircleDollarSign,
  FileSignature,
  FilePlus,
  Receipt,
  Target,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { getDashboardData } from "@/lib/actions/dashboard";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { RevenueChart } from "@/components/revenue-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const invoiceStatusVariant: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  DRAFT: "outline",
  SENT: "secondary",
  PARTIAL: "secondary",
  PAID: "default",
  VOID: "outline",
};

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { currency, stats } = data;

  const maxCategoryAmount = Math.max(
    1,
    ...data.expensesByCategory.map((c) => c.amount),
  );

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
      <PageHeader
        title="Overview"
        description="Key metrics, recent activity, and quick actions."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue this month"
          value={formatMoney(stats.revenueThisMonth, currency)}
          delta={stats.revenueDelta}
          deltaLabel="vs last month"
          icon={CircleDollarSign}
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(stats.outstanding, currency)}
          deltaLabel={
            stats.overdueCount > 0
              ? `${stats.overdueCount} overdue`
              : "No overdue"
          }
          icon={AlertCircle}
        />
        <StatCard
          label="Expenses this month"
          value={formatMoney(stats.expensesThisMonth, currency)}
          delta={stats.expensesDelta}
          deltaLabel="vs last month"
          icon={TrendingDown}
          invertDelta
        />
        <StatCard
          label="Pipeline value"
          value={formatMoney(stats.pipelineValue, currency)}
          deltaLabel={`${stats.openDealsCount} open deals (weighted)`}
          icon={Target}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Revenue trend</CardTitle>
                <CardDescription>Last 12 months · invoiced vs collected</CardDescription>
              </div>
              <Link
                href="/invoices"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                View invoices
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <RevenueChart data={data.revenueTrend} currency={currency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Expenses by category</CardTitle>
                <CardDescription>This month</CardDescription>
              </div>
              <Link
                href="/expenses"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                All
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.expensesByCategory.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No expenses recorded yet this month.
              </p>
            )}
            {data.expensesByCategory.map((c) => {
              const pct = (c.amount / maxCategoryAmount) * 100;
              return (
                <div key={c.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{c.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatMoney(c.amount, currency)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Recent invoices</CardTitle>
                <CardDescription>Last 5 invoices created</CardDescription>
              </div>
              <Link
                href="/invoices"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                All invoices
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentInvoices.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">
                No invoices yet.
              </p>
            ) : (
              <ul className="divide-y">
                {data.recentInvoices.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex items-center justify-between gap-4 px-6 py-3"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {inv.number ?? "Draft"} · {inv.client.name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {inv.issueDate.toISOString().slice(0, 10)} · Due{" "}
                        {inv.dueDate.toISOString().slice(0, 10)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium tabular-nums">
                        {formatMoney(inv.total, inv.currency)}
                      </span>
                      <Badge variant={invoiceStatusVariant[inv.status] ?? "secondary"}>
                        {inv.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">Upcoming billings</CardTitle>
                  <CardDescription>Next recurring runs</CardDescription>
                </div>
                <Link
                  href="/recurring"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  Manage
                  <ArrowUpRight className="size-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data.upcomingRecurring.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground">
                  Nothing scheduled.
                </p>
              ) : (
                <ul className="divide-y">
                  {data.upcomingRecurring.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-4 px-6 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {r.client.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {r.cadence.toLowerCase()} · next{" "}
                            {r.nextRunAt.toISOString().slice(0, 10)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">Pending time off</CardTitle>
                  <CardDescription>Awaiting decision</CardDescription>
                </div>
                <Link
                  href="/time-off"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  Review
                  <ArrowUpRight className="size-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data.pendingTimeOff.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground">
                  No pending requests.
                </p>
              ) : (
                <ul className="divide-y">
                  {data.pendingTimeOff.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-4 px-6 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {r.employee.firstName} {r.employee.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.type.toLowerCase()} · {r.days}d
                        </p>
                      </div>
                      <Badge variant="secondary">{r.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction href="/invoices/new" icon={FilePlus} label="New invoice" />
        <QuickAction href="/projects" icon={Briefcase} label="Log time" />
        <QuickAction href="/expenses/new" icon={Receipt} label="Add expense" />
        <QuickAction href="/employees" icon={FileSignature} label="Employee docs" />
      </div>
    </div>
  );
}

function QuickAction({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof Wallet;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "h-auto justify-start gap-3 px-4 py-3 text-left",
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">Get started</span>
      </span>
    </Link>
  );
}
