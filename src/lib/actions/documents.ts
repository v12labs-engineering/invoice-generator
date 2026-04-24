"use server";

import { createClient } from "@supabase/supabase-js";
import { requireMembership } from "./_shared";
import { db } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";
import { DocumentCategoryEnum } from "@/lib/schemas/hr";
import type { DocumentCategory } from "@prisma/client";

const BUCKET = "documents";
const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.ms-excel",
  "text/csv",
  "text/plain",
]);

function storageClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function listDocuments(category?: DocumentCategory) {
  const { businessId } = await requireMembership();
  return db.document.findMany({
    where: { businessId, ...(category ? { category } : {}) },
    include: { employee: true, uploadedBy: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function uploadDocument(
  formData: FormData,
): Promise<Result<{ id: string }>> {
  const { businessId, userId } = await requireMembership();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return err("Title is required");

  const categoryRaw = String(formData.get("category") ?? "OTHER");
  const catParsed = DocumentCategoryEnum.safeParse(categoryRaw);
  if (!catParsed.success) return err("Invalid category");

  const employeeIdRaw = String(formData.get("employeeId") ?? "");
  const employeeId = employeeIdRaw || null;
  if (employeeId) {
    const emp = await db.employee.findFirst({ where: { id: employeeId, businessId } });
    if (!emp) return err("Employee not found");
  }

  const notes = String(formData.get("notes") ?? "").trim() || null;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return err("File is required");
  if (file.size > MAX_BYTES) return err("File must be under 20MB");
  if (!ALLOWED.has(file.type)) return err("Unsupported file type");

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${businessId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const storage = storageClient();
  const { error: uploadError } = await storage.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return err(uploadError.message);

  const { data: pub } = storage.storage.from(BUCKET).getPublicUrl(path);

  const doc = await db.document.create({
    data: {
      businessId,
      employeeId,
      uploadedById: userId,
      title,
      category: catParsed.data,
      fileName: file.name,
      fileUrl: pub.publicUrl,
      fileType: file.type,
      fileSize: file.size,
      notes,
    },
  });

  revalidatePath("/documents");
  if (employeeId) revalidatePath(`/employees/${employeeId}`);
  return ok({ id: doc.id });
}

export async function deleteDocument(id: string): Promise<Result<null>> {
  const { businessId } = await requireMembership();

  const doc = await db.document.findFirst({ where: { id, businessId } });
  if (!doc) return err("Not found");

  const marker = `/${BUCKET}/`;
  const idx = doc.fileUrl.indexOf(marker);
  if (idx !== -1) {
    const path = doc.fileUrl.slice(idx + marker.length);
    await storageClient().storage.from(BUCKET).remove([path]);
  }

  await db.document.delete({ where: { id } });
  revalidatePath("/documents");
  if (doc.employeeId) revalidatePath(`/employees/${doc.employeeId}`);
  return ok(null);
}
