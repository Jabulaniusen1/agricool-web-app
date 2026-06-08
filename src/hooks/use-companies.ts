import { coldtivateService } from "@/services/coldtivate-service";
import { useAuthStore } from "@/stores/auth";
import { useApiCall } from "./use-api";

export function useCompanies() {
  const authCompany = useAuthStore((s) => s.company);
  const response = useApiCall("companies", () => coldtivateService.getCompanies());
  const companies = response.data ?? [];
  const data = authCompany && !companies.some((company) => company.id === authCompany.id)
    ? [authCompany, ...companies]
    : response.data;

  return { ...response, data };
}

export function useCompany(companyId: number | null) {
  return useApiCall(
    companyId ? `companies/${companyId}` : null,
    () => coldtivateService.getCompany(companyId!)
  );
}
