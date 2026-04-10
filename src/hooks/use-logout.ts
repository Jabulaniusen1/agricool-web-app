"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/stores/auth";
import { authService } from "@/services/auth-service";
import { ROUTES } from "@/constants/routes";

export function useLogout() {
  const { tokens, revokeSession } = useAuthStore();

  return useCallback(() => {
    const refreshToken = tokens?.refresh;
    // Clear local state first so the user isn't blocked waiting for the API
    revokeSession();
    localStorage.removeItem("auth");
    document.cookie = "agricool-auth=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    window.location.replace(ROUTES.SIGN_IN);
    // Blacklist the refresh token server-side (best-effort)
    if (refreshToken) {
      authService.logout(refreshToken).catch(() => {});
    }
  }, [tokens, revokeSession]);
}
