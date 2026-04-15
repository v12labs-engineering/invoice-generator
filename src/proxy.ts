import { auth } from "@/lib/auth";

export default auth((req) => {
  const path = req.nextUrl.pathname;

  if (path === "/login") return;
  if (path.startsWith("/api/auth")) return;
  if (path.startsWith("/api/cron")) return;

  if (!req.auth) {
    const url = new URL("/login", req.nextUrl.origin);
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
