import { auth } from "./auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function requestUrl(req: NextRequest, path: string) {
  const proto = req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "") || "http";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  return new URL(path, host ? `${proto}://${host}` : req.url);
}

function hostNameFromHeader(value: string | null) {
  const host = value?.split(",")[0]?.trim().toLowerCase();
  if (!host) return "";

  if (host.startsWith("[")) {
    const closingBracket = host.indexOf("]");
    return closingBracket >= 0 ? host.slice(1, closingBracket) : host;
  }

  return host.split(":")[0] ?? "";
}

function isLocalDocumentationHost(value: string | null) {
  const hostname = hostNameFromHeader(value);

  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "0.0.0.0";
}

// Next.js 16+ Proxy pattern (replaces middleware.ts)
export default auth((req: NextRequest & { auth: any }) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isBuildGuideRoute = nextUrl.pathname.startsWith("/build-guide");
  const isLocalBuildGuideRoute =
    isBuildGuideRoute && isLocalDocumentationHost(req.headers.get("x-forwarded-host") || req.headers.get("host"));
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute =
    ["/", "/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password", "/auth/verify-email", "/api/init-db"].includes(
      nextUrl.pathname
    ) || nextUrl.pathname.startsWith("/public") || isLocalBuildGuideRoute;
  const isAuthRoute = ["/auth/login", "/auth/register"].includes(nextUrl.pathname);

  if (isBuildGuideRoute && !isLocalBuildGuideRoute) {
    return new NextResponse("Not Found", { status: 404 });
  }

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
