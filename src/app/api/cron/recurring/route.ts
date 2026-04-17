import { db } from "@/lib/db";
import { calcInvoiceTotals, calcLineTotal } from "@/lib/money";
import { advanceNextRunAt } from "@/lib/recurring";
import type { Cadence } from "@prisma/client";

type LineTpl = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineDiscount: number;
  taxRate: number;
  sortOrder: number;
  productId?: string | null;
};
type Tpl = { currency: string; notes: string; terms: string; lines: LineTpl[] };

async function handle(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();

  // ── Recurring invoices ──
  const due = await db.recurringSchedule.findMany({
    where: {
      active: true,
      nextRunAt: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
  });

  let invoicesProcessed = 0;
  for (const s of due) {
    const tpl = s.templateJson as unknown as Tpl;
    const totals = calcInvoiceTotals(tpl.lines, 0);

    await db.invoice.create({
      data: {
        businessId: s.businessId,
        clientId: s.clientId,
        issueDate: now,
        dueDate: new Date(now.getTime() + 14 * 86400000),
        currency: tpl.currency,
        status: "DRAFT",
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        total: totals.total,
        balance: totals.total,
        notes: tpl.notes || null,
        terms: tpl.terms || null,
        recurringScheduleId: s.id,
        lines: {
          create: tpl.lines.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            lineDiscount: l.lineDiscount,
            taxRate: l.taxRate,
            sortOrder: l.sortOrder,
            productId: l.productId ?? null,
            lineTotal: calcLineTotal(l).total,
          })),
        },
      },
    });

    await db.recurringSchedule.update({
      where: { id: s.id },
      data: {
        lastRunAt: now,
        nextRunAt: advanceNextRunAt(s.nextRunAt, s.cadence as Cadence, s.intervalCount),
      },
    });
    invoicesProcessed++;
  }

  // ── Recurring subscription expenses ──
  const dueSubs = await db.subscription.findMany({
    where: {
      active: true,
      archivedAt: null,
      cost: { not: null },
      nextRunAt: { lte: now },
    },
  });

  let expensesProcessed = 0;
  for (const sub of dueSubs) {
    if (!sub.cost) continue;

    // Find or seed the SaaS & Software category for this business
    let category = await db.expenseCategory.findFirst({
      where: { businessId: sub.businessId, slug: "saas-software" },
    });
    if (!category) {
      category = await db.expenseCategory.create({
        data: {
          businessId: sub.businessId,
          name: "SaaS & Software",
          slug: "saas-software",
          isSystem: true,
        },
      });
    }

    // Find any member of this business to use as createdByUserId
    const membership = await db.membership.findFirst({
      where: { businessId: sub.businessId },
    });
    if (!membership) continue;

    await db.expense.create({
      data: {
        businessId: sub.businessId,
        createdByUserId: membership.userId,
        subscriptionId: sub.id,
        categoryId: category.id,
        description: `${sub.name} — ${sub.cycle.toLowerCase()} subscription`,
        amount: sub.cost,
        date: now,
        currency: "INR",
      },
    });

    await db.subscription.update({
      where: { id: sub.id },
      data: {
        lastRunAt: now,
        nextRunAt: advanceNextRunAt(sub.nextRunAt!, sub.cycle as Cadence, 1),
      },
    });
    expensesProcessed++;
  }

  return Response.json({
    invoicesProcessed,
    expensesProcessed,
  });
}

export const GET = handle;
export const POST = handle;
export const runtime = "nodejs";
