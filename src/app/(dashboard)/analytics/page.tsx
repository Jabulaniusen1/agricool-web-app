"use client";

import { useEffect, useMemo, useState } from "react";
import { Leaf, Users, TrendingUp, Droplets } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { useApiCall } from "@/hooks/use-api";
import { useCoolingUnits } from "@/hooks/use-cooling-units";
import { useCompanies } from "@/hooks/use-companies";
import { formatCurrency } from "@/lib/utils";
import { impactService } from "@/services/impact-service";
import { useDashboardStore } from "@/stores/dashboard";
import {
  Co2Metric,
  CompanyImpactSlice,
  CoolingUnitImpactSlice,
  ImpactMetricValue,
  ImpactMetricsRecord,
  ImpactSliceData,
} from "@/types/global";

const PIE_COLORS = ["#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0", "#dcfce7"];

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

function defaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

function firstRecordValue<T>(record: Record<string, T> | undefined): T | undefined {
  const firstKey = record ? Object.keys(record)[0] : undefined;
  return firstKey ? record?.[firstKey] : undefined;
}

function metricValue(value: ImpactMetricValue | undefined): number {
  if (value == null) return 0;
  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + metricValue(item), 0);
  }
  if (typeof value === "object") return metricValue(value.value);
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function primaryImpactMetrics(data: ImpactSliceData | null): ImpactMetricsRecord | null {
  if (!data?.impactMetrics) return null;
  return Array.isArray(data.impactMetrics) ? data.impactMetrics[0] ?? null : data.impactMetrics;
}

function errorMessage(error: unknown): string | undefined {
  return (error as { message?: string } | undefined)?.message;
}

function parseCo2Crops(input: Co2Metric["co2Crops"]): {
  co2From: number;
  co2To: number;
} {
  if (input && typeof input === "object") {
    return {
      co2From: Number(input.co2From ?? 0),
      co2To: Number(input.co2To ?? 0),
    };
  }

  if (typeof input === "string") {
    const from = input.match(/co2_from['"]?:\s*([-0-9.]+)/i)?.[1];
    const to = input.match(/co2_to['"]?:\s*([-0-9.]+)/i)?.[1];
    return {
      co2From: from ? Number(from) : 0,
      co2To: to ? Number(to) : 0,
    };
  }

  return { co2From: 0, co2To: 0 };
}

interface SummaryCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  isLoading: boolean;
}

function SummaryCard({ label, value, icon: Icon, color, isLoading }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          {isLoading ? (
            <>
              <Skeleton className="h-6 w-24 mb-1" />
              <Skeleton className="h-3 w-20" />
            </>
          ) : (
            <>
              <p className="text-xl font-bold truncate">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { selectedCompanyId, setSelectedCompany } = useDashboardStore();
  const { data: companies } = useCompanies();

  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [activeTab, setActiveTab] = useState("trend");

  const companyOptions = companies ?? [];
  const activeCompany = companyOptions.find((company) => company.id === selectedCompanyId)
    ?? companyOptions[0]
    ?? null;
  const activeCompanyId = activeCompany?.id ?? null;
  const activeCompanyLabel = activeCompany?.name
    || (activeCompanyId ? `Company ${activeCompanyId}` : "Select company");

  const { data: coolingUnits, isLoading: isCoolingUnitsLoading } = useCoolingUnits(
    activeCompanyId ? { companyId: activeCompanyId } : null
  );

  const coolingUnitIds = useMemo(
    () => (coolingUnits ?? []).map((unit) => unit.id),
    [coolingUnits]
  );
  const coolingUnitIdKey = coolingUnitIds.join(",");
  const unitIdsForRequest = useMemo(
    () => coolingUnitIdKey
      ? coolingUnitIdKey.split(",").map((id) => Number(id)).filter(Number.isFinite)
      : [],
    [coolingUnitIdKey]
  );
  const hasValidDateRange = Boolean(dateRange.from && dateRange.to && dateRange.from <= dateRange.to);
  const canLoadUnitSlices = !!activeCompanyId
    && hasValidDateRange
    && !isCoolingUnitsLoading
    && unitIdsForRequest.length > 0;
  const needsUnitBreakdown = activeTab === "crops" || activeTab === "utilization";
  const canLoadUnitBreakdown = canLoadUnitSlices && needsUnitBreakdown;

  useEffect(() => {
    if (activeCompanyId && selectedCompanyId !== activeCompanyId) {
      setSelectedCompany(activeCompanyId);
    }
  }, [activeCompanyId, selectedCompanyId, setSelectedCompany]);

  const {
    data: companyImpact = null,
    isLoading: isCompanyImpactLoading,
    error: companyImpactError,
  } = useApiCall<CompanyImpactSlice>(
    activeCompanyId ? `company-impact-${activeCompanyId}` : null,
    () => impactService.getCompanyImpact(activeCompanyId!)
  );

  const {
    data: impactData = null,
    isLoading: isImpactLoading,
    error: impactError,
  } = useApiCall<ImpactSliceData>(
    canLoadUnitSlices ? `impact-slice-${activeCompanyId}-${coolingUnitIdKey}-${dateRange.from}-${dateRange.to}` : null,
    () => impactService.getImpactSlice({
      companyId: activeCompanyId!,
      coolingUnitId: unitIdsForRequest,
      startDate: dateRange.from,
      endDate: dateRange.to,
      mode: "company",
      view: "aggregated",
    })
  );

  const {
    data: unitImpact = null,
    isLoading: isUnitImpactLoading,
    error: unitImpactError,
  } = useApiCall<CoolingUnitImpactSlice>(
    canLoadUnitBreakdown ? `coolingunit-slice-${coolingUnitIdKey}-${dateRange.from}-${dateRange.to}` : null,
    () => impactService.getCoolingUnitSlice({
      unitIds: unitIdsForRequest,
      startDate: dateRange.from,
      endDate: dateRange.to,
    })
  );

  const isCoreLoading = isCompanyImpactLoading || isCoolingUnitsLoading || isImpactLoading;
  const isUnitBreakdownLoading = isCoolingUnitsLoading || isUnitImpactLoading;
  const coreError = companyImpactError ?? impactError;
  const coreErrorMessage = errorMessage(coreError);
  const unitImpactErrorMessage = errorMessage(unitImpactError);

  const metrics = primaryImpactMetrics(impactData);
  const co2Totals = useMemo(() => {
    return (impactData?.co2Metrics ?? []).reduce(
      (acc, item) => {
        const crops = parseCo2Crops(item.co2Crops);
        return {
          co2From: acc.co2From + crops.co2From,
          co2To: acc.co2To + crops.co2To,
        };
      },
      { co2From: 0, co2To: 0 }
    );
  }, [impactData]);

  const companyCurrency = firstRecordValue(companyImpact?.currency) ?? activeCompany?.currency ?? "USD";
  const baselineLossKg = metricValue(metrics?.baselineKgLossMonth);
  const monthlyLossKg = metricValue(metrics?.monthlyKgLoss);
  const baselineRevenue = metricValue(metrics?.avgBaselineFarmerRevenueMonth);
  const monthlyRevenue = metricValue(metrics?.avgMonthlyFarmerRevenue);
  const foodSavedKg = Math.max(baselineLossKg - monthlyLossKg, 0);
  const co2ReductionKg = Math.max(co2Totals.co2From - co2Totals.co2To, 0);
  const farmersServed = firstRecordValue(companyImpact?.compFarmers) ?? 0;
  const revenue = firstRecordValue(companyImpact?.compRevenue) ?? 0;

  const cropBreakdown = useMemo(() => {
    const totals = new Map<string, number>();
    Object.values(unitImpact?.checkInKgCrop ?? {}).forEach((cropWeights) => {
      Object.entries(cropWeights ?? {}).forEach(([cropName, weight]) => {
        const safeWeight = Number(weight) || 0;
        totals.set(cropName, (totals.get(cropName) ?? 0) + safeWeight);
      });
    });

    return Array.from(totals.entries())
      .map(([cropName, weightKg], index) => ({ cropId: index, cropName, weightKg }))
      .filter((entry) => entry.weightKg > 0)
      .sort((a, b) => b.weightKg - a.weightKg);
  }, [unitImpact]);

  const unitUtilization = useMemo(() => {
    return Object.entries(unitImpact?.averageRoomOccupancy ?? {})
      .map(([key, value]) => ({
        name: unitImpact?.unitName?.[key] ?? `Unit ${unitImpact?.coolingUnitId?.[key] ?? key}`,
        utilizationPercent: Number(value) || 0,
      }))
      .filter((entry) => entry.utilizationPercent > 0);
  }, [unitImpact]);

  const impactEvolution = [
    { metric: "Food loss", baseline: baselineLossKg, current: monthlyLossKg },
    { metric: "Farmer revenue", baseline: baselineRevenue, current: monthlyRevenue },
    { metric: "CO2e", baseline: co2Totals.co2From, current: co2Totals.co2To },
  ].filter((entry) => entry.baseline > 0 || entry.current > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Analytics & Impact</h2>
          <p className="text-sm text-muted-foreground">
            Impact metrics for the selected company and period
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Select
          value={activeCompanyId?.toString() ?? ""}
          onValueChange={(value) => { if (value) setSelectedCompany(Number(value)); }}
          disabled={!companyOptions.length}
        >
          <SelectTrigger className="w-full sm:w-56">
            <span className={`flex-1 text-left truncate ${activeCompanyId ? "" : "text-gray-400"}`}>
              {activeCompanyLabel}
            </span>
          </SelectTrigger>
          <SelectContent>
            {companyOptions.map((company) => (
              <SelectItem key={company.id} value={company.id.toString()}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 shrink-0">From</span>
            <Input
              type="date"
              value={dateRange.from}
              className="w-36"
              onChange={(e) => setDateRange((range) => ({ ...range, from: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 shrink-0">To</span>
            <Input
              type="date"
              value={dateRange.to}
              className="w-36"
              onChange={(e) => setDateRange((range) => ({ ...range, to: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {!activeCompanyId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No company is available for this session. Sign in as a service provider or operator with a company attached.
        </div>
      )}

      {!hasValidDateRange && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Choose an end date that is on or after the start date.
        </div>
      )}

      {coreError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {coreErrorMessage ?? "Failed to load analytics data."}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Food Saved"
          value={`${formatNumber(foodSavedKg)} kg`}
          icon={Leaf}
          color="bg-green-100 text-green-700"
          isLoading={isCoreLoading}
        />
        <SummaryCard
          label="CO₂ Reduction"
          value={`${formatNumber(co2ReductionKg)} kg`}
          icon={Droplets}
          color="bg-blue-100 text-blue-700"
          isLoading={isCoreLoading}
        />
        <SummaryCard
          label="Farmers Served"
          value={formatNumber(farmersServed)}
          icon={Users}
          color="bg-purple-100 text-purple-700"
          isLoading={isCoreLoading}
        />
        <SummaryCard
          label="Revenue"
          value={formatCurrency(revenue, companyCurrency)}
          icon={TrendingUp}
          color="bg-orange-100 text-orange-700"
          isLoading={isCoreLoading}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="trend">Impact Evolution</TabsTrigger>
          <TabsTrigger value="crops">Crop Breakdown</TabsTrigger>
          <TabsTrigger value="utilization">Unit Utilization</TabsTrigger>
        </TabsList>

        <TabsContent value="trend" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-1.5">
                <TrendingUp size={16} className="text-green-600" />
                Baseline vs Current Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isCoreLoading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : impactEvolution.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={impactEvolution} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="metric" tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatNumber(value as number)}
                    />
                    <Tooltip
                      formatter={(value: unknown, name: unknown) => [
                        formatNumber(value as number),
                        name === "baseline" ? "Baseline" : "Current",
                      ]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                    />
                    <Bar dataKey="baseline" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="current" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[280px] text-center text-muted-foreground">
                  <TrendingUp size={32} className="mb-2" />
                  <p className="text-sm">No impact data available for this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crops" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-1.5">
                <Leaf size={16} className="text-green-600" />
                Crop Breakdown by Check-In Weight
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unitImpactError ? (
                <div className="flex flex-col items-center justify-center h-[280px] text-center text-muted-foreground">
                  <Leaf size={32} className="mb-2" />
                  <p className="text-sm">Cooling unit breakdown is unavailable from the impact backend.</p>
                  {unitImpactErrorMessage && (
                    <p className="text-xs mt-1 text-red-600">{unitImpactErrorMessage}</p>
                  )}
                </div>
              ) : isUnitBreakdownLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : cropBreakdown.length > 0 ? (
                <div className="flex flex-col lg:flex-row items-center gap-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={cropBreakdown}
                        dataKey="weightKg"
                        nameKey="cropName"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={false}
                        labelLine={false}
                      >
                        {cropBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: unknown) => [`${formatNumber(value as number)} kg`, "Weight"]}
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="flex flex-col gap-2 min-w-[160px]">
                    {cropBreakdown.map((entry, index) => (
                      <div key={entry.cropId} className="flex items-center gap-2 text-sm">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        <span className="truncate">{entry.cropName}</span>
                        <span className="text-muted-foreground ml-auto shrink-0">
                          {formatNumber(entry.weightKg)} kg
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[280px] text-center text-muted-foreground">
                  <Leaf size={32} className="mb-2" />
                  <p className="text-sm">No crop breakdown data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilization" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-1.5">
                <Droplets size={16} className="text-green-600" />
                Cooling Unit Utilization
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unitImpactError ? (
                <div className="flex flex-col items-center justify-center h-[280px] text-center text-muted-foreground">
                  <Droplets size={32} className="mb-2" />
                  <p className="text-sm">Cooling unit utilization is unavailable from the impact backend.</p>
                  {unitImpactErrorMessage && (
                    <p className="text-xs mt-1 text-red-600">{unitImpactErrorMessage}</p>
                  )}
                </div>
              ) : isUnitBreakdownLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="space-y-1">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ))}
                </div>
              ) : unitUtilization.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(200, unitUtilization.length * 50)}>
                  <BarChart layout="vertical" data={unitUtilization} margin={{ top: 5, right: 40, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value: unknown) => [`${(value as number).toFixed(1)}%`, "Utilization"]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                    />
                    <Bar
                      dataKey="utilizationPercent"
                      fill="#16a34a"
                      radius={[0, 4, 4, 0]}
                      label={{ position: "right", fontSize: 11, formatter: (value: unknown) => `${(value as number).toFixed(0)}%` }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-center text-muted-foreground">
                  <Droplets size={32} className="mb-2" />
                  <p className="text-sm">No utilization data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
