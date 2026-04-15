import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public paths
  if (path === "/login" || path === "/auth/callback" || path.startsWith("/api/cron")) {
    const { response } = await updateSession(request);
    return response;
  }

  const { response, user } = await updateSession(request);
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  const allowed = process.env.ALLOWED_EMAIL?.toLowerCase();
  if (!allowed || user.email?.toLowerCase() !== allowed) {
    return NextResponse.redirect(new URL("/login?denied=1", request.nextUrl));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|txt|xml)$).*)"],
};
