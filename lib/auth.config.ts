import type { NextAuthConfig } from "next-auth";

// Edge-safe config (used by middleware). No Prisma / bcrypt imports here.
export const authConfig = {
  pages: { signIn: "/login" },
  // 1-day sessions, refreshed at most hourly while in use. Admin APIs also re-check the role in the DB (lib/guards.ts).
  session: { strategy: "jwt", maxAge: 60 * 60 * 24, updateAge: 60 * 60 },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: "USER" | "ADMIN" }).role ?? "USER";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "USER" | "ADMIN") ?? "USER";
      }
      return session;
    },
    authorized({ auth, request }) {
      const isAdminArea = request.nextUrl.pathname.startsWith("/admin");
      if (!isAdminArea) return true;
      return auth?.user?.role === "ADMIN";
    },
  },
} satisfies NextAuthConfig;
