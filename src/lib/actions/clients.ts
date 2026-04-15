"use server";

import { db } from "@/lib/db";
import { ClientInput } from "@/lib/schemas/client";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";
import { requireUserId } from "./_shared";

export async function listClients() {
  const userId = await requireUserId();
  return db.client.findMany({
    where: { userId, archivedAt: null },
    orderBy: { name: "asc" },
  });
}

export async function createClient(input: unknown): Promise<Result<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = ClientInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  try {
    const client = await db.client.create({
      data: { ...parsed.data, userId, email: parsed.data.email || null },
    });
    revalidatePath("/clients");
    return ok({ id: client.id });
  } catch {
    return err("Failed to create client");
  }
}

export async function updateClient(id: string, input: unknown): Promise<Result<null>> {
  const userId = await requireUserId();
  const parsed = ClientInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  try {
    const result = await db.client.updateMany({
      where: { id, userId },
      data: { ...parsed.data, email: parsed.data.email || null },
    });
    if (result.count === 0) return err("Not found");
    revalidatePath("/clients");
    return ok(null);
  } catch {
    return err("Failed to update client");
  }
}

export async function archiveClient(id: string): Promise<Result<null>> {
  const userId = await requireUserId();
  try {
    const result = await db.client.updateMany({
      where: { id, userId },
      data: { archivedAt: new Date() },
    });
    if (result.count === 0) return err("Not found");
    revalidatePath("/clients");
    return ok(null);
  } catch {
    return err("Failed to archive client");
  }
}
