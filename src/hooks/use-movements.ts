import { coldtivateService } from "@/services/coldtivate-service";
import { MovementsQueryParams } from "@/types/api.params";
import { useApiCall } from "./use-api";

export function useMovements(params?: MovementsQueryParams) {
  const key = `movements?${new URLSearchParams(
    Object.fromEntries(
      Object.entries(params ?? {})
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, String(v)])
    )
  ).toString()}`;

  return useApiCall(key, () => coldtivateService.getMovements(params));
}
