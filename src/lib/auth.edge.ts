import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Edge-safe auth() — used only by middleware.ts. Does NOT include the
// Credentials provider, so it never pulls Prisma/bcryptjs into the Edge
// Runtime bundle. It can still read/validate the JWT session cookie.
export const { auth } = NextAuth(authConfig);
