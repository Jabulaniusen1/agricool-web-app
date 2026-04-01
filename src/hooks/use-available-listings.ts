import { marketplaceService } from "@/services/marketplace-service";
import { ListingsQueryParams } from "@/types/api.params";
import { useApiCall } from "./use-api";

export function useAvailableListings(params?: Partial<ListingsQueryParams>) {
  const locationId = params?.location;
  const key = locationId
    ? `available-listings?${new URLSearchParams(
        Object.fromEntries(
          Object.entries(params ?? {})
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, String(v)])
        )
      ).toString()}`
    : null; // skip fetch until location is selected

  return useApiCall(key, () =>
    marketplaceService.getAvailableListings(params as ListingsQueryParams)
  );
}
