"use client";

import { useEffect } from "react";
import { configureHttpClient } from "@/services/http-client";
import { useAuthStore } from "@/stores/auth";
import { authService } from "@/services/auth-service";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";

// ─── Synchronous bootstrap (runs before any React render) ────────────────────
// Configures the HTTP client with token & logout logic immediately when the
// module is first imported on the client. This ensures the Authorization header
// is present on the very first SWR request, even before useEffect fires.
if (typeof window !== "undefined") {
  configureHttpClient({
    getAuth: () => useAuthStore.getState(),
    refreshToken: (token) => authService.refreshToken(token),
    onUnauthorized: () => {
      useAuthStore.getState().revokeSession();
      document.cookie = "agricool-auth=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      window.location.replace(ROUTES.SIGN_IN);
    },
  });
}

// ─── Component: keeps cookie in sync & upgrades router redirect ──────────────
export function AuthInitializer() {
  const { revokeSession } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Override onUnauthorized with the proper Next.js router once mounted
    configureHttpClient({
      getAuth: () => useAuthStore.getState(),
      refreshToken: (token) => authService.refreshToken(token),
      onUnauthorized: () => {
        revokeSession();
        document.cookie = "agricool-auth=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        router.replace(ROUTES.SIGN_IN);
      },
    });

    // Sync auth state to cookie for middleware
    const syncCookie = () => {
      const state = useAuthStore.getState();
      if (state.isAuthenticated && state.tokens) {
        const cookieValue = JSON.stringify({
          state: { tokens: { access: state.tokens.access } },
        });
        document.cookie = `agricool-auth=${encodeURIComponent(cookieValue)}; path=/; max-age=86400; SameSite=Lax`;
      } else {
        document.cookie = "agricool-auth=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      }
    };

    syncCookie();

    const unsub = useAuthStore.subscribe(syncCookie);
    return () => unsub();
  }, [revokeSession, router]);

  return null;
}
