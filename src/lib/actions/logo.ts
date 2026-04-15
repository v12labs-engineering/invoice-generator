"use server";

import { createClient } from "@supabase/supabase-js";
import { requireUserId } from "./_shared";
import { db } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import { revalidatePath } from "next/cache";

const BUCKET = "logos";
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);

function storageClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function uploadLogo(formData: FormData): Promise<Result<{ url: string }>> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return err("Unauthenticated");
  }

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return err("No file provided");
  if (file.size > MAX_BYTES) return err("File must be under 2MB");
  if (!ALLOWED.has(file.type)) return err("Use PNG, JPEG, WebP, or SVG");

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "png";
  const path = `${userId}/logo-${Date.now()}.${ext}`;

  const storage = storageClient();
  const { error: uploadError } = await storage.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });
  if (uploadError) return err(uploadError.message);

  const { data: pub } = storage.storage.from(BUCKET).getPublicUrl(path);
  const url = pub.publicUrl;

  const profile = await db.businessProfile.findUnique({ where: { userId } });
  if (!profile) {
    return err("Save your business profile first, then upload a logo");
  }
  await db.businessProfile.update({ where: { userId }, data: { logoUrl: url } });

  revalidatePath("/settings");
  return ok({ url });
}

export async function removeLogo(): Promise<Result<null>> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return err("Unauthenticated");
  }

  const profile = await db.businessProfile.findUnique({ where: { userId } });
  if (!profile?.logoUrl) return ok(null);

  const marker = `/${BUCKET}/`;
  const idx = profile.logoUrl.indexOf(marker);
  if (idx !== -1) {
    const path = profile.logoUrl.slice(idx + marker.length);
    await storageClient().storage.from(BUCKET).remove([path]);
  }

  await db.businessProfile.update({ where: { userId }, data: { logoUrl: null } });
  revalidatePath("/settings");
  return ok(null);
}
