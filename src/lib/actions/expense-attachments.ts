"use server";

import { createClient } from "@supabase/supabase-js";
import { requireMembership } from "./_shared";
import { db } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";

const BUCKET = "expenses";
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
]);

function storageClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function uploadAttachment(
  expenseId: string,
  formData: FormData,
): Promise<Result<{ id: string; url: string }>> {
  const { businessId } = await requireMembership();

  const expense = await db.expense.findFirst({ where: { id: expenseId, businessId } });
  if (!expense) return err("Expense not found");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return err("No file provided");
  if (file.size > MAX_BYTES) return err("File must be under 10MB");
  if (!ALLOWED.has(file.type)) return err("Unsupported file type");

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${businessId}/${expenseId}/${Date.now()}.${ext}`;

  const storage = storageClient();
  const { error: uploadError } = await storage.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return err(uploadError.message);

  const { data: pub } = storage.storage.from(BUCKET).getPublicUrl(path);

  const attachment = await db.expenseAttachment.create({
    data: {
      expenseId,
      fileName: file.name,
      fileUrl: pub.publicUrl,
      fileType: file.type,
      fileSize: file.size,
    },
  });

  revalidatePath(`/expenses/${expenseId}`);
  return ok({ id: attachment.id, url: pub.publicUrl });
}

export async function deleteAttachment(id: string): Promise<Result<null>> {
  const { businessId } = await requireMembership();

  const attachment = await db.expenseAttachment.findUnique({
    where: { id },
    include: { expense: true },
  });
  if (!attachment || attachment.expense.businessId !== businessId) return err("Not found");

  const marker = `/${BUCKET}/`;
  const idx = attachment.fileUrl.indexOf(marker);
  if (idx !== -1) {
    const path = attachment.fileUrl.slice(idx + marker.length);
    await storageClient().storage.from(BUCKET).remove([path]);
  }

  await db.expenseAttachment.delete({ where: { id } });

  revalidatePath(`/expenses/${attachment.expenseId}`);
  return ok(null);
}
