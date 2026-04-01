import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/sign-in",
  "/sign-up",
  "/password-recovery",
  "/password-reset",
  "/invite",
];

const AUTH_ONLY_PATHS = ["/sign-in", "/sign-up", "/password-recovery", "/password-reset", "/invite"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check auth token from cookie (set via JS - fallback to header)
  // Since auth is stored in localStorage via Zustand, we use a custom cookie
  // The app sets this cookie via JS when the user logs in
  const authCookie = request.cookies.get("agricool-auth");
  let isAuthenticated = false;

  if (authCookie) {
    try {
      const parsed = JSON.parse(authCookie.value);
      isAuthenticated = !!(parsed?.state?.tokens?.access);
    } catch {
      isAuthenticated = false;
    }
  }

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isAuthOnlyPath = AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p));

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthOnlyPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users away from protected pages
  if (!isAuthenticated && !isPublicPath && pathname !== "/") {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect root to dashboard or sign-in
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isAuthenticated ? "/dashboard" : "/sign-in", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
