import { supabaseServer } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function requireUserId(): Promise<string> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("Unauthenticated");

  const allowed = process.env.ALLOWED_EMAIL?.toLowerCase();
  if (!allowed || user.email.toLowerCase() !== allowed) {
    throw new Error("Not authorized");
  }

  // Ensure Prisma User row exists (separate from Supabase auth.users)
  const existing = await db.user.findUnique({ where: { email: user.email } });
  if (existing) return existing.id;

  const created = await db.user.create({ data: { email: user.email } });
  return created.id;
}
