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

// Routes restricted to SERVICE_PROVIDER + OPERATOR
const MANAGER_ROUTES = [
  "/management",
  "/management/cooling-units",
  "/marketplace/cart",
  "/marketplace/orders",
  "/marketplace/company-orders",
  "/account/farmer-bank-accounts",
  "/account/marketplace-setup",
  "/account/coupons",
];

// Routes restricted to SERVICE_PROVIDER only
const SERVICE_PROVIDER_ROUTES = [
  "/management/locations",
  "/management/company",
  "/management/sensors",
  "/account/farmer-bank-accounts",
];

function isJwtExpired(token: string): boolean {
  try {
    const [, payloadB64 = ""] = token.split(".");
    if (!payloadB64) return true;

    const normalized = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { exp?: number };

    if (typeof payload.exp !== "number") return true;
    return Date.now() / 1000 >= payload.exp;
  } catch {
    return true;
  }
}

function parseAuthCookie(cookie: string | undefined): { isAuthenticated: boolean; role: string | null } {
  if (!cookie) return { isAuthenticated: false, role: null };
  try {
    const parsed = JSON.parse(cookie);
    const role = (parsed?.state?.user?.role as string | null | undefined) ?? null;

    // Primary: use refreshExp — session is alive as long as the refresh token is valid.
    // Interceptors will silently renew the access token, so checking access expiry
    // here would cause spurious redirects mid-session.
    const refreshExp = parsed?.state?.tokens?.refreshExp as number | undefined;
    if (typeof refreshExp === "number") {
      const isAuthenticated = Date.now() / 1000 < refreshExp;
      return { isAuthenticated, role };
    }

    // Fallback for older cookie format (access token only)
    const accessToken = parsed?.state?.tokens?.access as string | undefined;
    const isAuthenticated = !!(accessToken && !isJwtExpired(accessToken));
    return { isAuthenticated, role };
  } catch {
    return { isAuthenticated: false, role: null };
  }
}

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

  const authCookie = request.cookies.get("agricool-auth");
  const { isAuthenticated, role } = parseAuthCookie(authCookie?.value);

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

  // Redirect root
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isAuthenticated ? "/dashboard" : "/sign-in", request.url)
    );
  }

  // Role-based route guards (only when authenticated)
  if (isAuthenticated && role) {
    const isServiceProvider = role === "SERVICE_PROVIDER"; // ERoles.SERVICE_PROVIDER
    const isOperator = role === "OPERATOR";                 // ERoles.OPERATOR
    const isManager = isServiceProvider || isOperator;

    // SERVICE_PROVIDER only routes
    const isSpRoute = SERVICE_PROVIDER_ROUTES.some((r) => pathname.startsWith(r));
    if (isSpRoute && !isServiceProvider) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Manager-only routes (not already caught above)
    const isManagerRoute = MANAGER_ROUTES.some((r) => pathname.startsWith(r));
    if (isManagerRoute && !isManager) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
