"use client";

import { useState, useEffect } from "react";
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
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { impactService } from "@/services/impact-service";
import { useDashboardStore } from "@/stores/dashboard";
import { useCompanies } from "@/hooks/use-companies";
import { CompanyImpact, ImpactData } from "@/types/global";

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
  const [companyImpact, setCompanyImpact] = useState<CompanyImpact | null>(null);
  const [impactData, setImpactData] = useState<ImpactData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCompanyId = selectedCompanyId ?? companies?.[0]?.id ?? null;

  useEffect(() => {
    if (!activeCompanyId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      impactService.getCompanyImpact(activeCompanyId, dateRange.from, dateRange.to),
      impactService.getImpactData({
        companyId: activeCompanyId,
        startDate: dateRange.from,
        endDate: dateRange.to,
      }),
    ])
      .then(([ci, id]) => {
        if (!cancelled) {
          setCompanyImpact(ci);
          setImpactData(id);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load analytics data.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [activeCompanyId, dateRange.from, dateRange.to]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Analytics & Impact</h2>
          <p className="text-sm text-muted-foreground">
            Impact metrics for the selected company and period
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Company selector */}
        <Select
          value={activeCompanyId?.toString() ?? ""}
          onValueChange={(v) => { if (v) setSelectedCompany(Number(v)); }}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Select company" />
          </SelectTrigger>
          <SelectContent>
            {companies?.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date from */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground shrink-0">From</span>
          <Input
            type="date"
            value={dateRange.from}
            className="w-40"
            onChange={(e) => setDateRange((r) => ({ ...r, from: e.target.value }))}
          />
        </div>

        {/* Date to */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground shrink-0">To</span>
          <Input
            type="date"
            value={dateRange.to}
            className="w-40"
            onChange={(e) => setDateRange((r) => ({ ...r, to: e.target.value }))}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Food Saved"
          value={`${formatNumber(companyImpact?.foodSavedKg ?? 0)} kg`}
          icon={Leaf}
          color="bg-green-100 text-green-700"
          isLoading={isLoading}
        />
        <SummaryCard
          label="CO₂ Reduction"
          value={`${formatNumber(companyImpact?.co2ReductionKg ?? 0)} kg`}
          icon={Droplets}
          color="bg-blue-100 text-blue-700"
          isLoading={isLoading}
        />
        <SummaryCard
          label="Farmers Served"
          value={formatNumber(companyImpact?.farmersServed ?? 0)}
          icon={Users}
          color="bg-purple-100 text-purple-700"
          isLoading={isLoading}
        />
        <SummaryCard
          label="Revenue"
          value={`$${formatNumber(companyImpact?.revenue ?? 0)}`}
          icon={TrendingUp}
          color="bg-orange-100 text-orange-700"
          isLoading={isLoading}
        />
      </div>

      {/* Charts tabs */}
      <Tabs defaultValue="trend">
        <TabsList>
          <TabsTrigger value="trend">Monthly Trend</TabsTrigger>
          <TabsTrigger value="crops">Crop Breakdown</TabsTrigger>
          <TabsTrigger value="utilization">Unit Utilization</TabsTrigger>
        </TabsList>

        {/* Monthly food saved trend */}
        <TabsContent value="trend" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-1.5">
                <TrendingUp size={16} className="text-green-600" />
                Monthly Food Saved (kg)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : impactData && impactData.monthlySeries.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={impactData.monthlySeries}
                    margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${formatNumber(v as number)}`}
                    />
                    <Tooltip
                      formatter={(value: unknown) => [`${formatNumber(value as number)} kg`, "Food Saved"]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="foodSavedKg" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[280px] text-center text-muted-foreground">
                  <TrendingUp size={32} className="mb-2" />
                  <p className="text-sm">No trend data available for this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crop breakdown pie */}
        <TabsContent value="crops" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-1.5">
                <Leaf size={16} className="text-green-600" />
                Crop Breakdown by Weight
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : impactData && impactData.cropBreakdown.length > 0 ? (
                <div className="flex flex-col lg:flex-row items-center gap-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={impactData.cropBreakdown}
                        dataKey="weightKg"
                        nameKey="cropName"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry: { cropName?: string; percent?: number }) =>
                          `${entry.cropName ?? ""} ${((entry.percent ?? 0) * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {impactData.cropBreakdown.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: unknown) => [`${formatNumber(value as number)} kg`, "Weight"]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div className="flex flex-col gap-2 min-w-[160px]">
                    {impactData.cropBreakdown.map((entry, index) => (
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

        {/* Cooling unit utilization horizontal bar */}
        <TabsContent value="utilization" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-1.5">
                <Droplets size={16} className="text-green-600" />
                Cooling Unit Utilization
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-1">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ))}
                </div>
              ) : impactData && impactData.coolingUnitUtilization.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(200, impactData.coolingUnitUtilization.length * 50)}>
                  <BarChart
                    layout="vertical"
                    data={impactData.coolingUnitUtilization}
                    margin={{ top: 5, right: 40, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value: unknown) => [`${(value as number).toFixed(1)}%`, "Utilization"]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="utilizationPercent"
                      fill="#16a34a"
                      radius={[0, 4, 4, 0]}
                      label={{ position: "right", fontSize: 11, formatter: (v: unknown) => `${(v as number).toFixed(0)}%` }}
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
