import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import type { MemberRole } from "@prisma/client";

const ACTIVE_BUSINESS_COOKIE = "activeBusinessId";

/** Resolve the current Supabase-authenticated user, ensuring a Prisma User row exists. */
export async function requireUserId(): Promise<string> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("Unauthenticated");

  const existing = await db.user.findUnique({ where: { email: user.email } });
  if (existing) return existing.id;

  // First sign-in: create User row. Membership is created via auto-accept below
  // if a pending invite matches their email.
  const created = await db.user.create({ data: { email: user.email } });

  // Auto-accept pending invites by email.
  const invites = await db.invite.findMany({
    where: { email: user.email, acceptedAt: null },
  });
  if (invites.length > 0) {
    await db.$transaction(
      invites.flatMap((inv) => [
        db.membership.upsert({
          where: {
            userId_businessId: { userId: created.id, businessId: inv.businessId },
          },
          update: {},
          create: { userId: created.id, businessId: inv.businessId, role: inv.role },
        }),
        db.invite.update({
          where: { id: inv.id },
          data: { acceptedAt: new Date() },
        }),
      ]),
    );
  }

  return created.id;
}

export type Membership = {
  userId: string;
  businessId: string;
  role: MemberRole;
};

/** Ensure the current user is a member of the active business (or throws). */
export async function requireMembership(minRole?: MemberRole): Promise<Membership> {
  const userId = await requireUserId();
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value;

  // Load all of the user's memberships; pick the cookie-specified one if valid,
  // else the first one (and let the UI prompt to pick/create if none).
  const memberships = await db.membership.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (memberships.length === 0) {
    throw new Error("NoBusiness");
  }

  const active =
    memberships.find((m) => m.businessId === cookieValue) ?? memberships[0]!;

  if (minRole === "OWNER" && active.role !== "OWNER") {
    throw new Error("Forbidden");
  }

  return { userId, businessId: active.businessId, role: active.role };
}

/** Convenience: list all businesses the current user belongs to. */
export async function listMyBusinesses() {
  const userId = await requireUserId();
  return db.membership.findMany({
    where: { userId },
    include: { business: true },
    orderBy: { createdAt: "asc" },
  });
}

/** The currently active membership for UI helpers that only need the business id. */
export async function getActiveBusinessId(): Promise<string | null> {
  try {
    const m = await requireMembership();
    return m.businessId;
  } catch {
    return null;
  }
}

export const ACTIVE_BUSINESS_COOKIE_NAME = ACTIVE_BUSINESS_COOKIE;
