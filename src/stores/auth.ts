"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types/global";
import { authService } from "@/services/auth-service";

interface AuthTokens {
  access: string;
  refresh: string;
}

interface AuthStore {
  tokens: AuthTokens | null;
  user: User | null;
  isAuthenticated: boolean;
  setSession: (tokens: AuthTokens, user: User) => void;
  revokeSession: () => void;
  renewSession: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      tokens: null,
      user: null,
      isAuthenticated: false,

      setSession: (tokens, user) => {
        set({ tokens, user, isAuthenticated: true });
      },

      revokeSession: () => {
        set({ tokens: null, user: null, isAuthenticated: false });
      },

      renewSession: async () => {
        const { tokens } = get();
        if (!tokens?.refresh) return;

        try {
          const result = await authService.refreshToken(tokens.refresh);
          set((state) => ({
            tokens: {
              access: result.access,
              refresh: result.refresh ?? state.tokens?.refresh ?? "",
            },
          }));
        } catch {
          set({ tokens: null, user: null, isAuthenticated: false });
        }
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },
    }),
    {
      name: "auth",
      partialize: (state) => ({
        tokens: state.tokens,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
