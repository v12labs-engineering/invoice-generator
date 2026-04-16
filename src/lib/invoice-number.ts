import { db } from "@/lib/db";

const MAX_ATTEMPTS = 5;

const RETRYABLE_PG_CODES = new Set(["40001", "40P01"]);

function isRetryable(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; meta?: { code?: string }; message?: string };
  if (e.code && RETRYABLE_PG_CODES.has(e.code)) return true;
  if (e.meta?.code && RETRYABLE_PG_CODES.has(e.meta.code)) return true;
  if (e.code === "P2034") return true;
  if (typeof e.message === "string" && /write conflict|deadlock|could not serialize/i.test(e.message)) {
    return true;
  }
  return false;
}

export async function assignInvoiceNumber(businessId: string): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await db.$transaction(
        async (tx) => {
          const business = await tx.business.findUniqueOrThrow({ where: { id: businessId } });
          const n = business.nextInvoiceNumber;
          await tx.business.update({
            where: { id: businessId },
            data: { nextInvoiceNumber: n + 1 },
          });
          return `${business.invoicePrefix}${String(n).padStart(4, "0")}`;
        },
        { isolationLevel: "Serializable" },
      );
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err)) throw err;
      const delay = 10 * 2 ** attempt + Math.floor(Math.random() * 20);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
