import { auth } from "./auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function requestUrl(req: NextRequest, path: string) {
  const proto = req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "") || "http";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  return new URL(path, host ? `${proto}://${host}` : req.url);
}

// Next.js 16+ Proxy pattern (replaces middleware.ts)
export default auth((req: NextRequest & { auth: any }) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute =
    ["/", "/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password", "/auth/verify-email", "/api/init-db"].includes(
      nextUrl.pathname
    ) || nextUrl.pathname.startsWith("/public");
  const isAuthRoute = ["/auth/login", "/auth/register"].includes(nextUrl.pathname);

  if (isApiAuthRoute) return NextResponse.next();

  if (isAuthRoute) {
    if (isLoggedIn) {
      const role = req.auth?.user?.role;
      const target =
        role === "ADMIN"
          ? "/dashboard/admin/users"
          : role === "MODERATOR"
            ? "/dashboard/moderator"
            : "/dashboard/user";

      return NextResponse.redirect(requestUrl(req, target));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(requestUrl(req, "/auth/login"));
  }

  return NextResponse.next();
});

// Middleware config remains valid in proxy mode
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|icon|apple-icon|sw.js|icons/).*)"],
};
