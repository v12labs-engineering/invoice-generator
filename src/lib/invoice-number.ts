import { db } from "@/lib/db";

const MAX_ATTEMPTS = 5;

// Postgres serialization_failure / deadlock codes that warrant retry.
const RETRYABLE_PG_CODES = new Set(["40001", "40P01"]);

function isRetryable(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; meta?: { code?: string }; message?: string };
  if (e.code && RETRYABLE_PG_CODES.has(e.code)) return true;
  if (e.meta?.code && RETRYABLE_PG_CODES.has(e.meta.code)) return true;
  // Prisma surfaces serialization failures as P2034 (write conflict / deadlock).
  if (e.code === "P2034") return true;
  if (typeof e.message === "string" && /write conflict|deadlock|could not serialize/i.test(e.message)) {
    return true;
  }
  return false;
}

export async function assignInvoiceNumber(userId: string): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await db.$transaction(
        async (tx) => {
          const profile = await tx.businessProfile.findUniqueOrThrow({ where: { userId } });
          const n = profile.nextInvoiceNumber;
          await tx.businessProfile.update({
            where: { userId },
            data: { nextInvoiceNumber: n + 1 },
          });
          return `${profile.invoicePrefix}${String(n).padStart(4, "0")}`;
        },
        { isolationLevel: "Serializable" },
      );
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err)) throw err;
      // Exponential backoff with jitter before retry.
      const delay = 10 * 2 ** attempt + Math.floor(Math.random() * 20);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
