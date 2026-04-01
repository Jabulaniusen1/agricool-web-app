import { marketplaceService } from "@/services/marketplace-service";
import { OrdersQueryParams } from "@/types/api.params";
import { useApiCall } from "./use-api";

export function useOrders(params?: OrdersQueryParams) {
  const key = `orders?${new URLSearchParams(
    Object.fromEntries(
      Object.entries(params ?? {})
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, String(v)])
    )
  ).toString()}`;

  return useApiCall(key, () => marketplaceService.getOrders(params));
}

export function useSellerOrders(params?: OrdersQueryParams) {
  const key = `seller-orders?${new URLSearchParams(
    Object.fromEntries(
      Object.entries(params ?? {})
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, String(v)])
    )
  ).toString()}`;

  return useApiCall(key, () => marketplaceService.getSellerOrders(params));
}
