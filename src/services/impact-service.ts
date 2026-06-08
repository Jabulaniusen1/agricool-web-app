import { impactClient } from "./http-client";
import {
  CompanyImpactSlice,
  CoolingUnitImpact,
  CoolingUnitImpactSlice,
  ImpactData,
  ImpactSliceData,
} from "@/types/global";
import { CoolingUnitImpactParams, ImpactSliceParams } from "@/types/api.params";
import { ApiError } from "@/types/api.responses";

type ImpactMode = "company" | "cooling_unit";
type ImpactView = "aggregated" | "comparison";

type ImpactSliceRequest = {
  companyId: number;
  coolingUnitId: number | number[];
  startDate: string;
  endDate: string;
  mode: ImpactMode;
  view?: ImpactView;
};

type CoolingUnitSliceRequest = {
  unitIds: number | number[];
  startDate: string;
  endDate: string;
};

function formBody(params: Record<string, string | number | undefined>): URLSearchParams {
  const body = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) body.set(key, String(value));
  });
  return body;
}

function listParam(value: number | number[]): string {
  return Array.isArray(value) ? value.join(",") : String(value);
}

async function postForm<T>(url: string, params: Record<string, string | number | undefined>): Promise<T> {
  const res = await impactClient.post<T>(url, formBody(params), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  if (res.data && typeof res.data === "object" && "error" in res.data) {
    throw {
      message: String((res.data as { error: unknown }).error),
      status: res.status,
    } satisfies ApiError;
  }
  return res.data;
}

class ImpactService {
  async getCompanyImpact(companyId: number): Promise<CompanyImpactSlice> {
    return postForm<CompanyImpactSlice>("/company-slice/", { company_id: companyId });
  }

  async getCoolingUnitImpact(params: CoolingUnitImpactParams): Promise<CoolingUnitImpact> {
    const res = await impactClient.post<CoolingUnitImpact>("/coolingunit-slice/", params);
    return res.data;
  }

  async getCoolingUnitSlice(params: CoolingUnitSliceRequest): Promise<CoolingUnitImpactSlice> {
    return postForm<CoolingUnitImpactSlice>("/coolingunit-slice/", {
      unit_ids: listParam(params.unitIds),
      start_date: params.startDate,
      end_date: params.endDate,
    });
  }

  async getImpactSlice(params: ImpactSliceRequest): Promise<ImpactSliceData> {
    return postForm<ImpactSliceData>("/impact-slice/", {
      company_id: params.companyId,
      cooling_unit_id: listParam(params.coolingUnitId),
      start_date: params.startDate,
      end_date: params.endDate,
      mode: params.mode,
      view: params.view ?? "aggregated",
    });
  }

  async getImpactData(params: ImpactSliceParams): Promise<ImpactData> {
    const res = await impactClient.post<ImpactData>("/impact-slice/", params);
    return res.data;
  }
}

export const impactService = new ImpactService();
