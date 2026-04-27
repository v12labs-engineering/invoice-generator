"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import { requireMembership } from "./_shared";
import { DEFAULT_TEMPLATES } from "@/lib/docs/default-templates";
import { buildDocContext, substituteTemplate } from "@/lib/docs/substitute";
import { renderEmployeeDocPdf } from "@/lib/docs/render";
import type { DocType } from "@prisma/client";

const BUCKET = "documents";

function storageClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } },
  );
}

/**
 * Load (or synthesize) the template for a docType. Returns the current
 * editable body along with the default for this docType so the UI can
 * show a "reset" affordance.
 */
export async function loadDocTemplate(docType: DocType) {
  const { businessId } = await requireMembership();
  const existing = await db.documentTemplate.findUnique({
    where: { businessId_docType: { businessId, docType } },
  });
  const fallback = DEFAULT_TEMPLATES[docType];
  return {
    docType,
    title: existing?.title ?? fallback.title,
    body: existing?.body ?? fallback.body,
    isCustom: Boolean(existing),
    defaultTitle: fallback.title,
    defaultBody: fallback.body,
  };
}

/**
 * Build the prefilled text for an employee — loads template, substitutes vars.
 */
export async function buildPrefilledDoc(
  employeeId: string,
  docType: DocType,
): Promise<
  Result<{
    title: string;
    prefilledBody: string;
    rawTemplate: string;
    isCustomTemplate: boolean;
  }>
> {
  const { businessId } = await requireMembership();
  const [employee, business, tpl] = await Promise.all([
    db.employee.findFirst({ where: { id: employeeId, businessId } }),
    db.business.findUnique({ where: { id: businessId } }),
    loadDocTemplate(docType),
  ]);
  if (!employee) return err("Employee not found");
  if (!business) return err("Business not found");

  const ctx = buildDocContext({
    employee,
    business,
    signatory: { name: business.name, title: "Authorised signatory" },
  });

  return ok({
    title: tpl.title,
    prefilledBody: substituteTemplate(tpl.body, ctx),
    rawTemplate: tpl.body,
    isCustomTemplate: tpl.isCustom,
  });
}

export async function saveTemplateAsDefault(
  docType: DocType,
  input: { title: string; body: string },
): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  if (!input.title.trim()) return err("Title is required");
  if (!input.body.trim()) return err("Body is required");

  await db.documentTemplate.upsert({
    where: { businessId_docType: { businessId, docType } },
    update: { title: input.title, body: input.body },
    create: { businessId, docType, title: input.title, body: input.body },
  });
  revalidatePath("/documents");
  return ok(null);
}

export async function resetTemplateToDefault(docType: DocType): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  await db.documentTemplate.deleteMany({ where: { businessId, docType } });
  revalidatePath("/documents");
  return ok(null);
}

/**
 * Render & upload final PDF, create Document row.
 * Pass the *final* edited text (already variable-substituted by the editor).
 */
export async function generateEmployeeDoc(input: {
  employeeId: string;
  docType: DocType;
  title: string;
  body: string;
}): Promise<Result<{ id: string; url: string }>> {
  const { businessId, userId } = await requireMembership();

  const [employee, business] = await Promise.all([
    db.employee.findFirst({ where: { id: input.employeeId, businessId } }),
    db.business.findUnique({ where: { id: businessId } }),
  ]);
  if (!employee) return err("Employee not found");
  if (!business) return err("Business not found");
  if (!input.title.trim()) return err("Title is required");
  if (!input.body.trim()) return err("Body is required");

  const pdfBuffer = await renderEmployeeDocPdf({
    title: input.title,
    body: input.body,
    business: {
      name: business.name,
      addressLines: business.addressLines,
      email: business.email,
      logoUrl: business.logoUrl,
    },
  });

  const safeName = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const path = `${businessId}/generated/${input.employeeId}/${Date.now()}-${safeName}.pdf`;
  const storage = storageClient();
  const { error: uploadError } = await storage.storage
    .from(BUCKET)
    .upload(path, pdfBuffer, { contentType: "application/pdf", upsert: false });
  if (uploadError) return err(uploadError.message);

  const { data: pub } = storage.storage.from(BUCKET).getPublicUrl(path);

  const doc = await db.document.create({
    data: {
      businessId,
      employeeId: input.employeeId,
      uploadedById: userId,
      title: input.title,
      category: "CONTRACT",
      docType: input.docType,
      generatedBody: input.body,
      fileName: `${safeName}.pdf`,
      fileUrl: pub.publicUrl,
      fileType: "application/pdf",
      fileSize: pdfBuffer.length,
    },
  });

  revalidatePath(`/employees/${input.employeeId}`);
  revalidatePath("/documents");
  return ok({ id: doc.id, url: pub.publicUrl });
}

/**
 * Load a generated document for re-editing. Returns null if not found, not
 * generated (uploaded files have no body), or wrong business.
 */
export async function getEmployeeDocForEdit(docId: string) {
  const { businessId } = await requireMembership();
  const doc = await db.document.findFirst({
    where: { id: docId, businessId, employeeId: { not: null } },
  });
  if (!doc || !doc.generatedBody || !doc.docType) return null;
  return {
    id: doc.id,
    employeeId: doc.employeeId!,
    docType: doc.docType,
    title: doc.title,
    body: doc.generatedBody,
    fileUrl: doc.fileUrl,
  };
}

/**
 * Re-render an existing generated document with edited content. Replaces
 * the underlying storage file (uploaded with upsert=true), keeps the same
 * Document row id, and updates title / generatedBody / fileSize.
 */
export async function updateEmployeeDoc(input: {
  docId: string;
  title: string;
  body: string;
}): Promise<Result<{ id: string; url: string }>> {
  const { businessId } = await requireMembership();

  const doc = await db.document.findFirst({
    where: { id: input.docId, businessId },
  });
  if (!doc) return err("Document not found");
  if (!doc.docType || !doc.generatedBody) {
    return err("Only generated documents can be edited");
  }
  if (!input.title.trim()) return err("Title is required");
  if (!input.body.trim()) return err("Body is required");

  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business) return err("Business not found");

  const pdfBuffer = await renderEmployeeDocPdf({
    title: input.title,
    body: input.body,
    business: {
      name: business.name,
      addressLines: business.addressLines,
      email: business.email,
      logoUrl: business.logoUrl,
    },
  });

  // Reuse the existing storage path so the public URL stays stable.
  const marker = `/${BUCKET}/`;
  const idx = doc.fileUrl.indexOf(marker);
  if (idx === -1) return err("Could not locate underlying file");
  const path = doc.fileUrl.slice(idx + marker.length);

  const storage = storageClient();
  const { error: uploadError } = await storage.storage
    .from(BUCKET)
    .upload(path, pdfBuffer, { contentType: "application/pdf", upsert: true });
  if (uploadError) return err(uploadError.message);

  await db.document.update({
    where: { id: doc.id },
    data: {
      title: input.title,
      generatedBody: input.body,
      fileSize: pdfBuffer.length,
    },
  });

  if (doc.employeeId) revalidatePath(`/employees/${doc.employeeId}`);
  revalidatePath("/documents");
  return ok({ id: doc.id, url: doc.fileUrl });
}
