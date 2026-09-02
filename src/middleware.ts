import { NextResponse } from "next/server";
import { auth } from "@/lib/auth.edge";

// Protects every route except /login, /change-password (which is only
// reachable once authenticated, gated below), NextAuth's own API routes, the
// cron route (which has its own bearer-token check), and Next internals.
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;

  const isPublicPath = pathname === "/login";
  const isAuthApi = pathname.startsWith("/api/auth");
  const isCronApi = pathname.startsWith("/api/cron");

  if (isAuthApi || isCronApi) {
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    if (isPublicPath) return NextResponse.next();
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Logged in.
  if (isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  const mustChangePassword = req.auth?.user?.mustChangePassword;
  const isChangePasswordPath = pathname === "/change-password";

  if (mustChangePassword && !isChangePasswordPath) {
    return NextResponse.redirect(new URL("/change-password", nextUrl));
  }

  if (!mustChangePassword && isChangePasswordPath) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image (Next internals)
     * - favicon.ico, and other static assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
