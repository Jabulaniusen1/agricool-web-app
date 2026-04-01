"use client";

import { create } from "zustand";

interface MarketSurveyStore {
  pendingSurveyFarmerId: number | null;
  setPendingSurveyFarmerId: (id: number | null) => void;
}

export const useMarketSurveyStore = create<MarketSurveyStore>()((set) => ({
  pendingSurveyFarmerId: null,
  setPendingSurveyFarmerId: (id) => set({ pendingSurveyFarmerId: id }),
}));
