import { coldtivateService } from "@/services/coldtivate-service";
import { useApiCall } from "./use-api";

export function useProduces(coolingUnitId: number | null) {
  return useApiCall(
    coolingUnitId ? `produces/${coolingUnitId}` : null,
    () => coldtivateService.getCoolingUnitProduces(coolingUnitId!)
  );
}

export function useFarmerProduces(coolingUnitId: number | null, farmerId: number | null) {
  return useApiCall(
    coolingUnitId && farmerId ? `produces/${coolingUnitId}/farmer/${farmerId}` : null,
    () => coldtivateService.getFarmerProduces(coolingUnitId!, farmerId!)
  );
}
