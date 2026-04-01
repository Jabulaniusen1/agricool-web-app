import { coldtivateService } from "@/services/coldtivate-service";
import { useApiCall } from "./use-api";

export function useCompanies() {
  return useApiCall("companies", () => coldtivateService.getCompanies());
}

export function useCompany(companyId: number | null) {
  return useApiCall(
    companyId ? `companies/${companyId}` : null,
    () => coldtivateService.getCompany(companyId!)
  );
}
