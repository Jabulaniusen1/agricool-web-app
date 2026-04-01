import { coldtivateService } from "@/services/coldtivate-service";
import { useApiCall } from "./use-api";

export function useCoolingUnits(params?: { locationId?: number; companyId?: number }) {
  const key = params
    ? `cooling-units?${new URLSearchParams(
        Object.fromEntries(
          Object.entries(params)
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, String(v)])
        )
      ).toString()}`
    : "cooling-units";

  return useApiCall(key, () => coldtivateService.getCoolingUnits(params));
}

export function useCoolingUnit(id: number | null) {
  return useApiCall(
    id ? `cooling-units/${id}` : null,
    () => coldtivateService.getCoolingUnit(id!)
  );
}

export function useCoolingUnitTemperatures(params: {
  coolingUnitId: number | null;
  from?: string;
  to?: string;
}) {
  const { coolingUnitId, ...rest } = params;
  return useApiCall(
    coolingUnitId ? `cooling-unit-temperatures/${coolingUnitId}` : null,
    () => coldtivateService.getCoolingUnitTemperatures({ coolingUnitId: coolingUnitId!, ...rest })
  );
}

export function useCoolingUnitCapacity(coolingUnitId: number | null) {
  return useApiCall(
    coolingUnitId ? `cooling-unit-capacity/${coolingUnitId}` : null,
    () => coldtivateService.getCoolingUnitCapacity({ coolingUnitId: coolingUnitId! })
  );
}

export function useCrops() {
  return useApiCall("crops", () => coldtivateService.getCrops());
}

export function useCoolingUnitCrops() {
  return useApiCall("cooling-unit-crops", () => coldtivateService.getCoolingUnitCrops());
}
