import { coldtivateService } from "@/services/coldtivate-service";
import { useApiCall } from "./use-api";

export function useLocations(params?: { companyId?: number }) {
  const key = params?.companyId ? `locations?companyId=${params.companyId}` : "locations";
  return useApiCall(key, () => coldtivateService.getLocations(params));
}
