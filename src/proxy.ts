import { auth } from "./auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16+ Proxy pattern (replaces middleware.ts)
export default auth((req: NextRequest & { auth: any }) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute =
    ["/", "/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password", "/api/init-db"].includes(
      nextUrl.pathname
    ) || nextUrl.pathname.startsWith("/public");
  const isAuthRoute = ["/auth/login", "/auth/register"].includes(nextUrl.pathname);

  if (isApiAuthRoute) return NextResponse.next();

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard/user", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/login", nextUrl));
  }

  return NextResponse.next();
});

// Middleware config remains valid in proxy mode
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons/).*)"],
};
