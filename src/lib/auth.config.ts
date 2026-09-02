import type { NextAuthConfig } from "next-auth";

// Edge-safe base config (no Credentials provider, no Prisma, no bcryptjs) —
// used by middleware.ts, which runs on the Vercel Edge Runtime. The full
// config with the Credentials provider lives in auth.ts and runs in the
// Node.js runtime (API routes, server components, server actions).
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
        token.mustChangePassword = (user as { mustChangePassword?: boolean }).mustChangePassword ?? false;
      }
      if (trigger === "update" && session?.mustChangePassword === false) {
        token.mustChangePassword = false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.mustChangePassword = token.mustChangePassword as boolean;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
