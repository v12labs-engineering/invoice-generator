"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";
import {
  requireUserId,
  requireMembership,
  ACTIVE_BUSINESS_COOKIE_NAME,
} from "./_shared";
import { sendInviteEmail } from "@/lib/email/send-invite";

const COOKIE_OPTS = {
  httpOnly: false,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export async function createBusiness(input: {
  name: unknown;
  email: unknown;
  defaultCurrency: unknown;
}): Promise<Result<{ id: string }>> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return err("Unauthenticated");
  }

  const name = String(input.name ?? "").trim();
  const email = String(input.email ?? "").trim();
  const currency = String(input.defaultCurrency ?? "USD").trim().toUpperCase();
  if (!name) return err("Name required");
  if (!email.includes("@")) return err("Valid email required");
  if (currency.length !== 3) return err("Currency must be a 3-letter code");

  const business = await db.business.create({
    data: {
      name,
      email,
      defaultCurrency: currency,
      addressLines: [],
      memberships: { create: { userId, role: "OWNER" } },
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BUSINESS_COOKIE_NAME, business.id, COOKIE_OPTS);

  revalidatePath("/");
  return ok({ id: business.id });
}

export async function switchBusiness(businessId: string): Promise<Result<null>> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return err("Unauthenticated");
  }

  const membership = await db.membership.findUnique({
    where: { userId_businessId: { userId, businessId } },
  });
  if (!membership) return err("You are not a member of that business");

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BUSINESS_COOKIE_NAME, businessId, COOKIE_OPTS);

  revalidatePath("/");
  return ok(null);
}

export async function listTeam(): Promise<
  Result<{
    businessName: string;
    activeRole: "OWNER" | "MEMBER";
    members: { id: string; userId: string; email: string; role: "OWNER" | "MEMBER" }[];
    invites: { id: string; email: string; role: "OWNER" | "MEMBER"; createdAt: string }[];
  }>
> {
  let businessId: string;
  let role: "OWNER" | "MEMBER";
  try {
    const m = await requireMembership();
    businessId = m.businessId;
    role = m.role;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Unauthorized");
  }

  const [business, members, invites] = await Promise.all([
    db.business.findUniqueOrThrow({ where: { id: businessId } }),
    db.membership.findMany({
      where: { businessId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    db.invite.findMany({
      where: { businessId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return ok({
    businessName: business.name,
    activeRole: role,
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      email: m.user.email,
      role: m.role,
    })),
    invites: invites.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      createdAt: i.createdAt.toISOString(),
    })),
  });
}

export async function inviteMember(input: {
  email: unknown;
  role: unknown;
}): Promise<Result<{ id: string }>> {
  let businessId: string;
  let userId: string;
  try {
    const m = await requireMembership("OWNER");
    businessId = m.businessId;
    userId = m.userId;
  } catch {
    return err("Only owners can invite members");
  }

  const email = String(input.email ?? "").trim().toLowerCase();
  const roleStr = String(input.role ?? "MEMBER").toUpperCase();
  if (!email.includes("@")) return err("Valid email required");
  if (roleStr !== "OWNER" && roleStr !== "MEMBER") return err("Invalid role");
  const role = roleStr as "OWNER" | "MEMBER";

  // If the invitee already has an account with this email and is already a member, no-op.
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMembership = await db.membership.findUnique({
      where: { userId_businessId: { userId: existingUser.id, businessId } },
    });
    if (existingMembership) return err("Already a member");
  }

  // Create or re-issue invite.
  const invite = await db.invite.upsert({
    where: { businessId_email: { businessId, email } },
    create: { businessId, email, role, invitedById: userId },
    update: { role, acceptedAt: null, invitedById: userId, createdAt: new Date() },
  });

  // Best-effort email; invite works even if email fails (auto-accepts on sign-in).
  try {
    const [business, inviter] = await Promise.all([
      db.business.findUniqueOrThrow({ where: { id: businessId } }),
      db.user.findUniqueOrThrow({ where: { id: userId } }),
    ]);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://invoices.v12labs.io";
    await sendInviteEmail({
      to: email,
      businessName: business.name,
      inviterEmail: inviter.email,
      appUrl,
    });
  } catch (e) {
    console.warn("Invite email failed:", e);
  }

  revalidatePath("/team");
  return ok({ id: invite.id });
}

export async function revokeInvite(inviteId: string): Promise<Result<null>> {
  let businessId: string;
  try {
    const m = await requireMembership("OWNER");
    businessId = m.businessId;
  } catch {
    return err("Only owners can revoke invites");
  }

  const result = await db.invite.deleteMany({
    where: { id: inviteId, businessId, acceptedAt: null },
  });
  if (result.count === 0) return err("Invite not found");

  revalidatePath("/team");
  return ok(null);
}

export async function removeMember(membershipId: string): Promise<Result<null>> {
  let businessId: string;
  let currentUserId: string;
  try {
    const m = await requireMembership("OWNER");
    businessId = m.businessId;
    currentUserId = m.userId;
  } catch {
    return err("Only owners can remove members");
  }

  const target = await db.membership.findUnique({ where: { id: membershipId } });
  if (!target || target.businessId !== businessId) return err("Not found");
  if (target.userId === currentUserId) return err("Cannot remove yourself");

  // Prevent removing the last owner.
  if (target.role === "OWNER") {
    const owners = await db.membership.count({
      where: { businessId, role: "OWNER" },
    });
    if (owners <= 1) return err("Cannot remove the only owner");
  }

  await db.membership.delete({ where: { id: membershipId } });
  revalidatePath("/team");
  return ok(null);
}
