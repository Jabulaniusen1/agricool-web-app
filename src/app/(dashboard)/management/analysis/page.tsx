"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { BarChart3, TrendingUp, DollarSign } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { impactService } from "@/services/impact-service";
import { useDashboardStore } from "@/stores/dashboard";
import { useApiCall } from "@/hooks/use-api";
import { formatCurrency } from "@/lib/utils";

// ─── Date Range Options ────────────────────────────────────────────────────────

type DateRange = "7d" | "30d" | "90d" | "1y";

function getDateRange(range: DateRange): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  const daysMap: Record<DateRange, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
  from.setDate(from.getDate() - daysMap[range]);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

// ─── Skeletons ─────────────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-5">
        <div className={`rounded-full p-2.5 ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Revenue Tab ──────────────────────────────────────────────────────────────

function RevenueTab({ companyId, range }: { companyId: number; range: DateRange }) {
  const { from, to } = getDateRange(range);

  const { data, isLoading } = useApiCall(
    `impact-data-${companyId}-${range}`,
    () => impactService.getImpactData({ companyId, from, to })
  );

  const revenueByUnit = data?.coolingUnitUtilization?.map((cu) => ({
    name: cu.name,
    revenue: Math.round(cu.utilizationPercent * 500), // Derived estimate from utilization
    utilization: cu.utilizationPercent,
  })) ?? [];

  const monthlySeries = data?.monthlySeries?.map((m) => ({
    month: m.month,
    foodSaved: m.foodSavedKg,
    co2: m.co2ReductionKg,
  })) ?? [];

  if (isLoading) return <ChartSkeleton />;

  if (!data) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No data available for this period
      </div>
    );
  }

  const totalRevenue = data.coolingUnitUtilization?.length
    ? revenueByUnit.reduce((sum, u) => sum + u.revenue, 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Estimated Revenue"
          value={formatCurrency(totalRevenue, "USD")}
          icon={DollarSign}
          color="bg-green-600"
        />
        <StatCard
          label="Food Saved (kg)"
          value={monthlySeries.reduce((s, m) => s + m.foodSaved, 0).toFixed(0)}
          icon={TrendingUp}
          color="bg-blue-500"
        />
        <StatCard
          label="CO₂ Reduced (kg)"
          value={monthlySeries.reduce((s, m) => s + m.co2, 0).toFixed(0)}
          icon={BarChart3}
          color="bg-emerald-500"
        />
      </div>

      {revenueByUnit.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Revenue by Cooling Unit</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueByUnit} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: unknown) => formatCurrency(v as number, "USD")} />
                <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {monthlySeries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Monthly Food Saved & CO₂ Reduction</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlySeries} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="foodSaved"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={false}
                  name="Food Saved (kg)"
                />
                <Line
                  type="monotone"
                  dataKey="co2"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="CO₂ Reduced (kg)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Utilization Tab ──────────────────────────────────────────────────────────

function UtilizationTab({ companyId, range }: { companyId: number; range: DateRange }) {
  const { from, to } = getDateRange(range);

  const { data, isLoading } = useApiCall(
    `impact-data-${companyId}-${range}`,
    () => impactService.getImpactData({ companyId, from, to })
  );

  const utilizationData = data?.coolingUnitUtilization?.map((cu) => ({
    name: cu.name,
    occupancy: Math.round(cu.utilizationPercent),
  })) ?? [];

  if (isLoading) return <ChartSkeleton />;

  if (!utilizationData.length) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No utilization data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Occupancy Rate by Cooling Unit (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={utilizationData}
              layout="vertical"
              margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} />
              <Tooltip formatter={(v: unknown) => `${v}%`} />
              <Bar dataKey="occupancy" fill="#16a34a" radius={[0, 4, 4, 0]} name="Occupancy" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AnalysisPage() {
  const { selectedCompanyId } = useDashboardStore();
  const [range, setRange] = useState<DateRange>("30d");

  const companyId = selectedCompanyId ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 size={20} className="text-green-600" />
            Revenue & Usage Analysis
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track performance across your cooling network
          </p>
        </div>

        {/* Date Range */}
        <Select value={range} onValueChange={(v) => setRange(v as DateRange)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!companyId && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No company selected. Please select a company from the dashboard.
        </div>
      )}

      {!!companyId && (
        <Tabs defaultValue="revenue">
          <TabsList className="mb-4">
            <TabsTrigger value="revenue" className="gap-1.5">
              <DollarSign size={14} />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="utilization" className="gap-1.5">
              <TrendingUp size={14} />
              Utilization
            </TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <RevenueTab companyId={companyId} range={range} />
          </TabsContent>
          <TabsContent value="utilization">
            <UtilizationTab companyId={companyId} range={range} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
