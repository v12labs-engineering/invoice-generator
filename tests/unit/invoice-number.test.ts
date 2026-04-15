import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { assignInvoiceNumber } from "@/lib/invoice-number";
import { db } from "@/lib/db";

describe("assignInvoiceNumber", () => {
  let userId: string;

  beforeEach(async () => {
    // Clean in dependency order
    await db.invoice.deleteMany();
    await db.businessProfile.deleteMany();
    await db.user.deleteMany();
    const user = await db.user.create({ data: { email: `t${Date.now()}@t.com` } });
    userId = user.id;
    await db.businessProfile.create({
      data: {
        userId,
        name: "Biz",
        email: "biz@x.com",
        invoicePrefix: "INV-",
        nextInvoiceNumber: 7,
        defaultCurrency: "USD",
      },
    });
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("returns formatted number and increments counter", async () => {
    const num = await assignInvoiceNumber(userId);
    expect(num).toBe("INV-0007");
    const profile = await db.businessProfile.findUnique({ where: { userId } });
    expect(profile?.nextInvoiceNumber).toBe(8);
  });

  it("produces unique numbers under concurrent calls", async () => {
    const results = await Promise.all([1, 2, 3].map(() => assignInvoiceNumber(userId)));
    const set = new Set(results);
    expect(set.size).toBe(3);
  });
});
