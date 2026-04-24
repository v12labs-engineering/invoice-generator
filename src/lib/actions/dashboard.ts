"use server";

import { db } from "@/lib/db";
import { requireMembership } from "./_shared";

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short" });
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getDashboardData() {
  const { businessId } = await requireMembership();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = addMonths(monthStart, -1);
  const twelveMonthsAgo = addMonths(monthStart, -11);

  const [
    business,
    outstandingAgg,
    paidThisMonth,
    paidLastMonth,
    expensesThisMonth,
    expensesLastMonth,
    overdueCount,
    openDeals,
    issuedInvoicesLast12,
    paymentsLast12,
    expensesByCategoryRaw,
    recentInvoices,
    upcomingRecurring,
    pendingTimeOff,
  ] = await Promise.all([
    db.business.findUnique({ where: { id: businessId } }),
    db.invoice.aggregate({
      where: { businessId, status: { in: ["SENT", "PARTIAL"] } },
      _sum: { balance: true },
    }),
    db.payment.aggregate({
      where: { invoice: { businessId }, paidAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    db.payment.aggregate({
      where: { invoice: { businessId }, paidAt: { gte: prevMonthStart, lt: monthStart } },
      _sum: { amount: true },
    }),
    db.expense.aggregate({
      where: { businessId, date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    db.expense.aggregate({
      where: { businessId, date: { gte: prevMonthStart, lt: monthStart } },
      _sum: { amount: true },
    }),
    db.invoice.count({
      where: { businessId, status: { in: ["SENT", "PARTIAL"] }, dueDate: { lt: now } },
    }),
    db.deal.findMany({
      where: {
        businessId,
        stage: { notIn: ["WON", "LOST"] },
      },
      select: { value: true, probability: true },
    }),
    db.invoice.findMany({
      where: { businessId, issueDate: { gte: twelveMonthsAgo } },
      select: { issueDate: true, total: true },
    }),
    db.payment.findMany({
      where: { invoice: { businessId }, paidAt: { gte: twelveMonthsAgo } },
      select: { paidAt: true, amount: true },
    }),
    db.expense.groupBy({
      by: ["categoryId"],
      where: { businessId, date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    db.invoice.findMany({
      where: { businessId },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.recurringSchedule.findMany({
      where: { businessId, active: true, nextRunAt: { gte: now } },
      include: { client: true },
      orderBy: { nextRunAt: "asc" },
      take: 5,
    }),
    db.timeOffRequest.findMany({
      where: { businessId, status: "PENDING" },
      include: { employee: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  // Build 12-month series (pre-seed zeros)
  const series: Record<string, { month: string; label: string; issued: number; paid: number }> = {};
  for (let i = 0; i < 12; i++) {
    const m = addMonths(twelveMonthsAgo, i);
    series[monthKey(m)] = { month: monthKey(m), label: monthLabel(m), issued: 0, paid: 0 };
  }
  for (const inv of issuedInvoicesLast12) {
    const k = monthKey(inv.issueDate);
    if (series[k]) series[k].issued += inv.total;
  }
  for (const p of paymentsLast12) {
    const k = monthKey(p.paidAt);
    if (series[k]) series[k].paid += p.amount;
  }
  const revenueTrend = Object.values(series);

  // Resolve category labels
  const categoryIds = expensesByCategoryRaw.map((r) => r.categoryId);
  const categories = categoryIds.length
    ? await db.expenseCategory.findMany({ where: { id: { in: categoryIds } } })
    : [];
  const expensesByCategory = expensesByCategoryRaw
    .map((r) => ({
      name: categories.find((c) => c.id === r.categoryId)?.name ?? "Unknown",
      amount: r._sum.amount ?? 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  const paid = paidThisMonth._sum.amount ?? 0;
  const paidPrev = paidLastMonth._sum.amount ?? 0;
  const expenses = expensesThisMonth._sum.amount ?? 0;
  const expensesPrev = expensesLastMonth._sum.amount ?? 0;
  const pipelineValue = openDeals.reduce(
    (sum, d) => sum + Math.round(((d.value ?? 0) * d.probability) / 100),
    0,
  );

  function pctDelta(current: number, prev: number): number | null {
    if (prev === 0) return current === 0 ? 0 : null;
    return Math.round(((current - prev) / prev) * 100);
  }

  return {
    currency: business?.defaultCurrency ?? "USD",
    stats: {
      revenueThisMonth: paid,
      revenueDelta: pctDelta(paid, paidPrev),
      outstanding: outstandingAgg._sum.balance ?? 0,
      overdueCount,
      expensesThisMonth: expenses,
      expensesDelta: pctDelta(expenses, expensesPrev),
      pipelineValue,
      openDealsCount: openDeals.length,
    },
    revenueTrend,
    expensesByCategory,
    recentInvoices,
    upcomingRecurring,
    pendingTimeOff,
  };
}
