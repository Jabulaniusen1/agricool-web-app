"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Cart } from "@/types/global";

interface ShoppingCartStore {
  cart: Cart | null;
  setCart: (cart: Cart | null) => void;
  clearCart: () => void;
}

export const useShoppingCartStore = create<ShoppingCartStore>()(
  persist(
    (set) => ({
      cart: null,
      setCart: (cart) => set({ cart }),
      clearCart: () => set({ cart: null }),
    }),
    {
      name: "shopping-cart",
    }
  )
);
