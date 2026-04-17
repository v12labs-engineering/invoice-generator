"use server";

import { db } from "@/lib/db";
import { CategoryInput } from "@/lib/schemas/category";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";
import { requireMembership } from "./_shared";

const DEFAULT_CATEGORIES = [
  "SaaS & Software",
  "Rent & Workspace",
  "Travel",
  "Meals & Entertainment",
  "Office Supplies",
  "Contractors & Freelancers",
  "Professional Services",
  "Internet & Phone",
  "Marketing & Advertising",
  "Insurance",
  "Equipment & Hardware",
  "Bank & Payment Fees",
  "Miscellaneous",
];

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function ensureDefaults(businessId: string) {
  const count = await db.expenseCategory.count({ where: { businessId } });
  if (count > 0) return;

  await db.expenseCategory.createMany({
    data: DEFAULT_CATEGORIES.map((name, i) => ({
      businessId,
      name,
      slug: slugify(name),
      isSystem: true,
      isActive: true,
      sortOrder: i,
    })),
  });
}

export async function listCategories() {
  const { businessId } = await requireMembership();
  await ensureDefaults(businessId);
  return db.expenseCategory.findMany({
    where: { businessId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createCategory(input: unknown): Promise<Result<{ id: string }>> {
  const { businessId } = await requireMembership();
  const parsed = CategoryInput.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  const slug = slugify(parsed.data.name);

  try {
    const category = await db.expenseCategory.create({
      data: { businessId, name: parsed.data.name, slug, isSystem: false },
    });
    revalidatePath("/expenses");
    return ok({ id: category.id });
  } catch {
    return err("Category already exists");
  }
}

export async function toggleCategory(id: string): Promise<Result<null>> {
  const { businessId } = await requireMembership();
  const cat = await db.expenseCategory.findFirst({ where: { id, businessId } });
  if (!cat) return err("Not found");

  await db.expenseCategory.update({
    where: { id },
    data: { isActive: !cat.isActive },
  });
  revalidatePath("/expenses");
  return ok(null);
}
