import { farmerImpactClient } from "./http-client";
import { FarmerBaseImpact, FarmerImpact, ImpactMetrics } from "@/types/global";
import { FarmerImpactParams } from "@/types/api.params";

class FarmerImpactService {
  async getFarmerBaseImpact(farmerId: number): Promise<FarmerBaseImpact> {
    const res = await farmerImpactClient.post<FarmerBaseImpact>("/farmer-base-slice/", {
      farmerId,
    });
    return res.data;
  }

  async getFarmerImpact(params: FarmerImpactParams): Promise<FarmerImpact> {
    const res = await farmerImpactClient.post<FarmerImpact>("/farmer-slice/", params);
    return res.data;
  }

  async getImpactMetrics(params: FarmerImpactParams): Promise<ImpactMetrics> {
    const res = await farmerImpactClient.post<ImpactMetrics>("/impact-slice/", params);
    return res.data;
  }
}

export const farmerImpactService = new FarmerImpactService();
