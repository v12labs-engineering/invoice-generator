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
  const due = await db.recurringSchedule.findMany({
    where: {
      active: true,
      nextRunAt: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
  });

  let processed = 0;
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
    processed++;
  }

  return Response.json({ processed });
}

export const GET = handle;
export const POST = handle;
export const runtime = "nodejs";
