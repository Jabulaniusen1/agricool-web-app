"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DashboardProduce } from "@/types/global";

interface DashboardStore {
  selectedCoolingUnitId: number | null;
  selectedCompanyId: number | null;
  produces: DashboardProduce[];
  setSelectedCoolingUnit: (id: number | null) => void;
  setSelectedCompany: (id: number | null) => void;
  setProduces: (produces: DashboardProduce[]) => void;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      selectedCoolingUnitId: null,
      selectedCompanyId: null,
      produces: [],

      setSelectedCoolingUnit: (id) => set({ selectedCoolingUnitId: id }),
      setSelectedCompany: (id) => set({ selectedCompanyId: id }),
      setProduces: (produces) => set({ produces }),
    }),
    {
      name: "dashboard",
      partialize: (state) => ({
        selectedCoolingUnitId: state.selectedCoolingUnitId,
        selectedCompanyId: state.selectedCompanyId,
      }),
    }
  )
);
