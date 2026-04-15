"use server";

import { db } from "@/lib/db";
import { PaymentInput } from "@/lib/schemas/payment";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";
import { requireUserId } from "./_shared";

export async function recordPayment(input: unknown): Promise<Result<null>> {
  const userId = await requireUserId();
  const parsed = PaymentInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  const invoice = await db.invoice.findFirst({
    where: { id: parsed.data.invoiceId, userId },
  });
  if (!invoice) return err("Invoice not found");
  if (invoice.status === "VOID") return err("Cannot pay voided invoice");

  const newPaid = invoice.amountPaid + parsed.data.amount;
  if (newPaid > invoice.total) return err("Payment exceeds balance");

  const newBalance = invoice.total - newPaid;
  const newStatus = newBalance === 0 ? "PAID" : "PARTIAL";

  try {
    await db.$transaction([
      db.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: parsed.data.amount,
          paidAt: parsed.data.paidAt,
          method: parsed.data.method,
          reference: parsed.data.reference || null,
          note: parsed.data.note || null,
        },
      }),
      db.invoice.update({
        where: { id: invoice.id },
        data: { amountPaid: newPaid, balance: newBalance, status: newStatus },
      }),
    ]);

    revalidatePath(`/invoices/${invoice.id}`);
    revalidatePath("/invoices");
    return ok(null);
  } catch {
    return err("Failed to record payment");
  }
}
