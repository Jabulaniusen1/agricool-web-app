"use client";

import { create } from "zustand";
import { CoolingUnit, CoolingUnitCrop, Farmer, EDateCropped } from "@/types/global";

export type CheckInCrateItem = {
  weight: number;
  tag?: string;
  isSellable: boolean;
  coolingUnitId: number;
  plannedDays?: number;
  checkOut: null;
};

export type ProduceCrate = {
  crop: CoolingUnitCrop;
  additionalInfo: string;
  crates: CheckInCrateItem[];
  harvestDate: EDateCropped | undefined;
  price: number | undefined;
};

export type CrateWeightPricingInput = {
  crates: Array<{ weight: number; tag?: string; isSellable: boolean }>;
  sellingPrice: number;
  applyToAll: boolean;
  companyCurrency: string;
};

export type CrateWeightPricingResult = {
  crates: Array<{ weight: number; tag?: string; isSellable: boolean }>;
  price: number | undefined;
};

type State = {
  produces: ProduceCrate[];
  coolingUnit: CoolingUnit | null;
  farmer: Farmer | null;
  checkOutCode: string | null;
  pendingCrop: { crop: CoolingUnitCrop; additionalInfo: string } | null;
  editingProduce: ProduceCrate | null;
  crateWeightPricingInput: CrateWeightPricingInput | null;
  crateWeightPricingResult: CrateWeightPricingResult | null;
};

type Actions = {
  addProduce: (produce: ProduceCrate) => void;
  removeProduce: (produce: ProduceCrate) => void;
  setProduces: (produces: ProduceCrate[]) => void;
  setCoolingUnit: (cu: CoolingUnit | null) => void;
  setFarmer: (farmer: Farmer | null) => void;
  setCheckOutCode: (code: string | null) => void;
  setPendingCrop: (crop: { crop: CoolingUnitCrop; additionalInfo: string } | null) => void;
  setEditingProduce: (produce: ProduceCrate | null) => void;
  setCrateWeightPricingInput: (input: CrateWeightPricingInput | null) => void;
  setCrateWeightPricingResult: (result: CrateWeightPricingResult | null) => void;
  resetStore: () => void;
};

export const useCheckInStore = create<State & Actions>((set, get) => ({
  produces: [],
  coolingUnit: null,
  farmer: null,
  checkOutCode: null,
  pendingCrop: null,
  editingProduce: null,
  crateWeightPricingInput: null,
  crateWeightPricingResult: null,

  addProduce: (produce) => set({ produces: [...get().produces, produce] }),
  removeProduce: (produce) =>
    set({ produces: get().produces.filter((p) => p !== produce) }),
  setProduces: (produces) => set({ produces }),
  setCoolingUnit: (coolingUnit) => set({ coolingUnit }),
  setFarmer: (farmer) => set({ farmer }),
  setCheckOutCode: (checkOutCode) => set({ checkOutCode }),
  setPendingCrop: (pendingCrop) => set({ pendingCrop }),
  setEditingProduce: (editingProduce) => set({ editingProduce }),
  setCrateWeightPricingInput: (crateWeightPricingInput) => set({ crateWeightPricingInput }),
  setCrateWeightPricingResult: (crateWeightPricingResult) => set({ crateWeightPricingResult }),
  resetStore: () =>
    set({
      produces: [],
      coolingUnit: null,
      farmer: null,
      checkOutCode: null,
      pendingCrop: null,
      editingProduce: null,
      crateWeightPricingInput: null,
      crateWeightPricingResult: null,
    }),
}));
