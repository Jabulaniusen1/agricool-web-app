"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ManagementStore {
  selectedCompanyId: number | null;
  selectedLocationId: number | null;
  setSelectedCompany: (id: number | null) => void;
  setSelectedLocation: (id: number | null) => void;
}

export const useManagementStore = create<ManagementStore>()(
  persist(
    (set) => ({
      selectedCompanyId: null,
      selectedLocationId: null,

      setSelectedCompany: (id) => set({ selectedCompanyId: id }),
      setSelectedLocation: (id) => set({ selectedLocationId: id }),
    }),
    {
      name: "management",
    }
  )
);
