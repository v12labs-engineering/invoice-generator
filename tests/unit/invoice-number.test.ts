import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { assignInvoiceNumber } from "@/lib/invoice-number";
import { db } from "@/lib/db";

describe("assignInvoiceNumber", () => {
  let businessId: string;

  beforeEach(async () => {
    // Clean in dependency order
    await db.invoice.deleteMany();
    await db.membership.deleteMany();
    await db.business.deleteMany();
    await db.user.deleteMany();
    const user = await db.user.create({ data: { email: `t${Date.now()}@t.com` } });
    const business = await db.business.create({
      data: {
        name: "Biz",
        email: "biz@x.com",
        invoicePrefix: "INV-",
        nextInvoiceNumber: 7,
        defaultCurrency: "USD",
        memberships: { create: { userId: user.id, role: "OWNER" } },
      },
    });
    businessId = business.id;
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("returns formatted number and increments counter", async () => {
    const num = await assignInvoiceNumber(businessId);
    expect(num).toBe("INV-0007");
    const business = await db.business.findUnique({ where: { id: businessId } });
    expect(business?.nextInvoiceNumber).toBe(8);
  });

  it("produces unique numbers under concurrent calls", async () => {
    const results = await Promise.all([1, 2, 3].map(() => assignInvoiceNumber(businessId)));
    const set = new Set(results);
    expect(set.size).toBe(3);
  });
});
