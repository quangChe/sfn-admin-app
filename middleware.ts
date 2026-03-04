import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/api/auth"];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => pathname.startsWith(path));
}

export default auth((req: NextRequest & { auth: { user?: unknown; error?: string } | null }) => {
  const { pathname } = req.nextUrl;

  // Allow public paths and Next.js internals
  if (
    isPublicPath(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // No session — redirect to login
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Token refresh error — force re-login
  if (req.auth.error === "RefreshTokenError") {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "RefreshTokenError");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
