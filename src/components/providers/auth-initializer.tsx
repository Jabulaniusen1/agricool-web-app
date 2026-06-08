"use client";

import { useEffect } from "react";
import { configureHttpClient } from "@/services/http-client";
import { useAuthStore } from "@/stores/auth";
import { authService } from "@/services/auth-service";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";

function getJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function buildCookieValue(): string {
  const state = useAuthStore.getState();
  if (!state.isAuthenticated || !state.tokens) return "";
  return JSON.stringify({
    state: {
      tokens: {
        access: state.tokens.access,
        refreshExp: getJwtExp(state.tokens.refresh),
      },
      user: { role: state.user?.role ?? null },
    },
  });
}

function clearAuthArtifacts() {
  localStorage.removeItem("auth");
  document.cookie = "agricool-auth=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
}

function hasValidStoredSession(): boolean {
  const state = useAuthStore.getState();
  const refreshExp = state.tokens?.refresh ? getJwtExp(state.tokens.refresh) : null;
  return !!(
    state.isAuthenticated &&
    state.tokens?.access &&
    state.tokens?.refresh &&
    state.user?.role &&
    refreshExp &&
    Date.now() / 1000 < refreshExp
  );
}

// ─── Synchronous bootstrap (runs before any React render) ────────────────────
// Configures the HTTP client with token & logout logic immediately when the
// module is first imported on the client. This ensures the Authorization header
// is present on the very first SWR request, even before useEffect fires.
if (typeof window !== "undefined") {
  configureHttpClient({
    getAuth: () => useAuthStore.getState(),
    refreshToken: (token) => authService.refreshToken(token),
    updateTokens: (newTokens) => useAuthStore.getState().updateTokens(newTokens),
    onUnauthorized: () => {
      useAuthStore.getState().revokeSession();
      clearAuthArtifacts();
      window.location.replace(ROUTES.SIGN_IN);
    },
  });
}

// ─── Component: keeps cookie in sync & upgrades router redirect ──────────────
export function AuthInitializer() {
  const { revokeSession } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Migration/session guard: users logged in before auth fixes, or users with
    // broken persisted state, must re-login before any protected UI renders.
    if (useAuthStore.getState().isAuthenticated && !hasValidStoredSession()) {
      revokeSession();
      clearAuthArtifacts();
      router.replace(ROUTES.SIGN_IN);
      return;
    }

    // Override onUnauthorized with the proper Next.js router once mounted
    configureHttpClient({
      getAuth: () => useAuthStore.getState(),
      refreshToken: (token) => authService.refreshToken(token),
      updateTokens: (newTokens) => useAuthStore.getState().updateTokens(newTokens),
      onUnauthorized: () => {
        revokeSession();
        clearAuthArtifacts();
        router.replace(ROUTES.SIGN_IN);
      },
    });

    // Sync auth state to cookie for middleware
    const syncCookie = () => {
      const cookieValue = buildCookieValue();
      if (cookieValue) {
        document.cookie = `agricool-auth=${encodeURIComponent(cookieValue)}; path=/; max-age=86400; SameSite=Lax`;
      } else {
        clearAuthArtifacts();
      }
    };

    syncCookie();

    const unsub = useAuthStore.subscribe(syncCookie);
    return () => unsub();
  }, [revokeSession, router]);

  return null;
}
