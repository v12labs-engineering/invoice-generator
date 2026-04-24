"use server";

import { db } from "@/lib/db";
import { ContactInput } from "@/lib/schemas/crm";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";
import { requireMembership } from "./_shared";

function normalize(input: ReturnType<typeof ContactInput.parse>) {
  return {
    name: input.name,
    email: input.email || null,
    phone: input.phone || null,
    title: input.title || null,
    clientId: input.clientId || null,
    notes: input.notes || null,
  };
}

export async function listContacts() {
  const { businessId } = await requireMembership();
  return db.contact.findMany({
    where: { businessId, archivedAt: null },
    include: { client: true },
    orderBy: { name: "asc" },
  });
}

export async function createContact(input: unknown): Promise<Result<{ id: string }>> {
  const { businessId } = await requireMembership();
  const parsed = ContactInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  try {
    const contact = await db.contact.create({
      data: { ...normalize(parsed.data), businessId },
    });
    revalidatePath("/contacts");
    return ok({ id: contact.id });
  } catch {
    return err("Failed to create contact");
  }
}

export async function updateContact(id: string, input: unknown): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  const parsed = ContactInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  const result = await db.contact.updateMany({
    where: { id, businessId },
    data: normalize(parsed.data),
  });
  if (result.count === 0) return err("Not found");
  revalidatePath("/contacts");
  return ok(null);
}

export async function archiveContact(id: string): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  const result = await db.contact.updateMany({
    where: { id, businessId },
    data: { archivedAt: new Date() },
  });
  if (result.count === 0) return err("Not found");
  revalidatePath("/contacts");
  return ok(null);
}
