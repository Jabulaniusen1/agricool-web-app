import { coldtivateService } from "@/services/coldtivate-service";
import { useApiCall } from "./use-api";

export function useFarmers(params?: { operatorId?: number }) {
  const key = params?.operatorId ? `farmers?operatorId=${params.operatorId}` : "farmers";
  return useApiCall(key, () => coldtivateService.getFarmers(params));
}

export function useFarmer(farmerId: number | null) {
  return useApiCall(
    farmerId ? `farmers/${farmerId}` : null,
    () => coldtivateService.getFarmer(farmerId!)
  );
}
