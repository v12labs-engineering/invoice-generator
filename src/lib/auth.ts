import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.RESEND_FROM,
    }),
  ],
  session: { strategy: "database" },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user }) {
      const allowed = process.env.ALLOWED_EMAIL?.toLowerCase();
      if (!user.email || !allowed) return false;
      return user.email.toLowerCase() === allowed;
    },
    async session({ session, user }) {
      if (session.user && user?.id) session.user.id = user.id;
      return session;
    },
  },
});
