"use server";

import { db } from "@/lib/db";
import { ProjectInput, TimeEntryInput } from "@/lib/schemas/project";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";
import { requireMembership } from "./_shared";
import { assignInvoiceNumber } from "@/lib/invoice-number";
import { calcInvoiceTotals } from "@/lib/money";

function normalizeProject(input: ReturnType<typeof ProjectInput.parse>) {
  return {
    name: input.name,
    description: input.description || null,
    clientId: input.clientId || null,
    status: input.status,
    hourlyRate: input.hourlyRate,
    currency: input.currency,
    budgetAmount: input.budgetAmount,
    budgetHours: input.budgetHours,
    startDate: input.startDate,
    endDate: input.endDate,
  };
}

export async function listProjects() {
  const { businessId } = await requireMembership();
  return db.project.findMany({
    where: { businessId, archivedAt: null },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProject(id: string) {
  const { businessId } = await requireMembership();
  return db.project.findFirst({
    where: { id, businessId },
    include: {
      client: true,
      timeEntries: {
        include: { user: true },
        orderBy: { date: "desc" },
      },
    },
  });
}

export async function createProject(input: unknown): Promise<Result<{ id: string }>> {
  const { businessId } = await requireMembership();
  const parsed = ProjectInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  try {
    const project = await db.project.create({
      data: { ...normalizeProject(parsed.data), businessId },
    });
    revalidatePath("/projects");
    return ok({ id: project.id });
  } catch {
    return err("Failed to create project");
  }
}

export async function updateProject(id: string, input: unknown): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  const parsed = ProjectInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  try {
    const result = await db.project.updateMany({
      where: { id, businessId },
      data: normalizeProject(parsed.data),
    });
    if (result.count === 0) return err("Not found");
    revalidatePath(`/projects/${id}`);
    revalidatePath("/projects");
    return ok(null);
  } catch {
    return err("Failed to update project");
  }
}

export async function archiveProject(id: string): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  const result = await db.project.updateMany({
    where: { id, businessId },
    data: { archivedAt: new Date(), status: "ARCHIVED" },
  });
  if (result.count === 0) return err("Not found");
  revalidatePath("/projects");
  return ok(null);
}

export async function createTimeEntry(input: unknown): Promise<Result<{ id: string }>> {
  const { businessId, userId } = await requireMembership();
  const parsed = TimeEntryInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  const project = await db.project.findFirst({
    where: { id: parsed.data.projectId, businessId },
  });
  if (!project) return err("Project not found");

  try {
    const entry = await db.timeEntry.create({
      data: {
        businessId,
        projectId: parsed.data.projectId,
        userId,
        date: parsed.data.date,
        minutes: parsed.data.minutes,
        description: parsed.data.description,
        billable: parsed.data.billable,
        hourlyRate: parsed.data.hourlyRate ?? project.hourlyRate,
      },
    });
    revalidatePath(`/projects/${parsed.data.projectId}`);
    return ok({ id: entry.id });
  } catch {
    return err("Failed to log time");
  }
}

export async function deleteTimeEntry(id: string): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  const entry = await db.timeEntry.findFirst({ where: { id, businessId } });
  if (!entry) return err("Not found");
  if (entry.invoiceLineId) return err("Entry is already invoiced");
  await db.timeEntry.delete({ where: { id } });
  revalidatePath(`/projects/${entry.projectId}`);
  return ok(null);
}

/**
 * Convert all uninvoiced billable time entries on a project into a DRAFT invoice.
 * One invoice line per time entry, priced at (minutes/60) * hourlyRate.
 */
export async function invoiceProjectTime(
  projectId: string,
): Promise<Result<{ invoiceId: string }>> {
  const { businessId, userId } = await requireMembership();

  const project = await db.project.findFirst({
    where: { id: projectId, businessId },
    include: { client: true },
  });
  if (!project) return err("Project not found");
  if (!project.clientId) return err("Project has no client to bill");

  const entries = await db.timeEntry.findMany({
    where: {
      businessId,
      projectId,
      billable: true,
      invoiceLineId: null,
    },
    orderBy: { date: "asc" },
  });
  if (entries.length === 0) return err("No uninvoiced billable time");

  const lines = entries.map((e, i) => {
    const rate = e.hourlyRate ?? project.hourlyRate ?? 0;
    if (rate <= 0) throw new Error("Missing hourly rate");
    const hours = e.minutes / 60;
    const unitPrice = Math.round(rate * hours);
    return {
      entryId: e.id,
      data: {
        description: `${project.name} — ${e.date.toISOString().slice(0, 10)} — ${e.description}`,
        quantity: 1,
        unitPrice,
        lineDiscount: 0,
        taxRate: 0,
        sortOrder: i,
        lineTotal: unitPrice,
      },
    };
  });

  const totals = calcInvoiceTotals(
    lines.map((l) => ({
      quantity: l.data.quantity,
      unitPrice: l.data.unitPrice,
      lineDiscount: 0,
      taxRate: 0,
    })),
    0,
  );

  try {
    const number = await assignInvoiceNumber(businessId);
    const result = await db.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          businessId,
          createdByUserId: userId,
          number,
          clientId: project.clientId!,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          currency: project.currency,
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          taxAmount: totals.taxAmount,
          total: totals.total,
          balance: totals.total,
        },
      });

      for (const l of lines) {
        const line = await tx.invoiceLine.create({
          data: { invoiceId: invoice.id, ...l.data },
        });
        await tx.timeEntry.update({
          where: { id: l.entryId },
          data: { invoiceLineId: line.id },
        });
      }

      return invoice;
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/invoices");
    return ok({ invoiceId: result.id });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to create invoice");
  }
}
