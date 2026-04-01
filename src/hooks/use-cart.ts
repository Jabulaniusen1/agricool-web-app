import { marketplaceService } from "@/services/marketplace-service";
import { useApiCall } from "./use-api";
import { useShoppingCartStore } from "@/stores/shopping-cart";
import { useEffect } from "react";

export function useCart() {
  const { setCart } = useShoppingCartStore();
  const result = useApiCall("cart", () => marketplaceService.getCart());

  useEffect(() => {
    if (result.data) {
      setCart(result.data);
    }
  }, [result.data, setCart]);

  return result;
}
