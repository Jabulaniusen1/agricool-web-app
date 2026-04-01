"use client";

import { createContext, useContext, useMemo } from "react";
import { createContextualCan } from "@casl/react";
import { AppAbility, defineAbilityFor } from "./rbac";
import { useAuthStore } from "@/stores/auth";

const AbilityContext = createContext<AppAbility>(defineAbilityFor(undefined));

export const Can = createContextualCan(AbilityContext.Consumer);

export function AbilityProvider({ children }: { children: React.ReactNode }) {
  const role = useAuthStore((s) => s.user?.role);
  const ability = useMemo(() => defineAbilityFor(role), [role]);

  return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>;
}

export function useAbility() {
  return useContext(AbilityContext);
}
