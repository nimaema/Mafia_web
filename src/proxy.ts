import { auth } from "./auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getTrustedBaseUrlFromRequest } from "./lib/site";

function requestUrl(req: NextRequest, path: string) {
  return new URL(path, getTrustedBaseUrlFromRequest(req));
}

type AuthenticatedRequest = NextRequest & {
  auth?: {
    user?: {
      role?: string | null;
    } | null;
  } | null;
};

// Next.js 16+ Proxy pattern (replaces middleware.ts)
export default auth((req: AuthenticatedRequest) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute =
    ["/", "/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password", "/auth/verify-email"].includes(
      nextUrl.pathname
    ) || nextUrl.pathname.startsWith("/public") || nextUrl.pathname.startsWith("/fonts/");
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|icon|apple-icon|sw.js|icons/|fonts/).*)"],
};
