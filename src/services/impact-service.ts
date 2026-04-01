import { impactClient } from "./http-client";
import { CompanyImpact, CoolingUnitImpact, ImpactData } from "@/types/global";
import { CoolingUnitImpactParams, ImpactSliceParams } from "@/types/api.params";

class ImpactService {
  async getCompanyImpact(companyId: number): Promise<CompanyImpact> {
    const res = await impactClient.post<CompanyImpact>("/company-slice/", { companyId });
    return res.data;
  }

  async getCoolingUnitImpact(params: CoolingUnitImpactParams): Promise<CoolingUnitImpact> {
    const res = await impactClient.post<CoolingUnitImpact>("/coolingunit-slice/", params);
    return res.data;
  }

  async getImpactData(params: ImpactSliceParams): Promise<ImpactData> {
    const res = await impactClient.post<ImpactData>("/impact-slice/", params);
    return res.data;
  }
}

export const impactService = new ImpactService();
