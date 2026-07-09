import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyTokenEdge } from "@/lib/auth-edge";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public client-facing endpoints (origin-validated in route handlers)
  if (pathname.match(/^\/api\/v1\/apps\/[^/]+\/(subscribe|unsubscribe)/)) {
    return NextResponse.next();
  }

  // Send / track endpoints use Bearer API key or are public
  if (pathname.match(/^\/api\/v1\/(send|notifications\/send|track)/)) {
    return NextResponse.next();
  }

  // Fully public paths
  const publicPrefixes = [
    "/", "/login", "/register", "/forgot-password", "/reset-password",
    "/api/auth", "/api/health-check",
    "/_next", "/push-sw.js",
  ];
  if (publicPrefixes.some((p) => p === pathname || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Dashboard routes — require valid session cookie
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/apps") ||
    pathname.startsWith("/settings")
  ) {
    const token = request.cookies.get("pushnest_session")?.value;
    if (!token) return NextResponse.redirect(new URL("/login", request.url));
    const user = await verifyTokenEdge(token);
    if (!user) return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
