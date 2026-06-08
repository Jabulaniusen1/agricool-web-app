"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Company, User } from "@/types/global";

interface AuthTokens {
  access: string;
  refresh: string;
}

interface AuthStore {
  tokens: AuthTokens | null;
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  setSession: (tokens: AuthTokens, user: User, company?: Company | null) => void;
  revokeSession: () => void;
  updateTokens: (newTokens: { access: string; refresh?: string }) => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      tokens: null,
      user: null,
      company: null,
      isAuthenticated: false,

      setSession: (tokens, user, company = null) => {
        set({ tokens, user, company, isAuthenticated: true });
      },

      revokeSession: () => {
        set({ tokens: null, user: null, company: null, isAuthenticated: false });
      },

      updateTokens: (newTokens) => {
        set((state) => ({
          tokens: state.tokens
            ? {
                access: newTokens.access,
                refresh: newTokens.refresh ?? state.tokens.refresh,
              }
            : null,
        }));
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
        company: state.company,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
