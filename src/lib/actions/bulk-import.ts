"use server";

import { db } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";
import { requireMembership } from "./_shared";
import { listCategories } from "./categories";

type ImportRow = {
  date: string;
  description: string;
  amount: string;
  reference?: string;
};

export async function importExpenses(
  rows: ImportRow[],
  fileName: string,
): Promise<Result<{ imported: number; skipped: number }>> {
  const { businessId, userId } = await requireMembership();

  const categories = await listCategories();
  const miscCategory = categories.find((c) => c.slug === "miscellaneous");
  if (!miscCategory) return err("Default categories not found");

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  const bulkImport = await db.bulkImport.create({
    data: {
      businessId,
      userId,
      fileName,
      rowCount: rows.length,
      importedCount: 0,
      skippedCount: 0,
    },
  });

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const date = new Date(row.date);
    if (isNaN(date.getTime())) {
      errors.push(`Row ${i + 1}: invalid date "${row.date}"`);
      skipped++;
      continue;
    }

    const rawAmount = parseFloat(row.amount.replace(/[^0-9.\-]/g, ""));
    if (isNaN(rawAmount) || rawAmount <= 0) {
      errors.push(`Row ${i + 1}: invalid amount "${row.amount}"`);
      skipped++;
      continue;
    }

    const amountCents = Math.round(Math.abs(rawAmount) * 100);

    await db.expense.create({
      data: {
        businessId,
        createdByUserId: userId,
        description: row.description || `Imported row ${i + 1}`,
        amount: amountCents,
        date,
        categoryId: miscCategory.id,
        currency: "INR",
        reference: row.reference || null,
        bulkImportId: bulkImport.id,
      },
    });
    imported++;
  }

  await db.bulkImport.update({
    where: { id: bulkImport.id },
    data: {
      importedCount: imported,
      skippedCount: skipped,
      errorLog: errors.length > 0 ? errors : undefined,
    },
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return ok({ imported, skipped });
}
