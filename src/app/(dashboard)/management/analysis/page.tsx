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
import { BarChart3, TrendingUp, DollarSign, Activity, Package } from "lucide-react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { impactService } from "@/services/impact-service";
import { coldtivateService } from "@/services/coldtivate-service";
import { useDashboardStore } from "@/stores/dashboard";
import { useCoolingUnits } from "@/hooks/use-cooling-units";
import { useApiCall } from "@/hooks/use-api";
import { formatCurrency, formatDate, formatWeight } from "@/lib/utils";
import { Movement } from "@/types/global";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type DateRange = "7d" | "30d" | "90d" | "1y";

function getDateRange(range: DateRange): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  const daysMap: Record<DateRange, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
  from.setDate(from.getDate() - daysMap[range]);
  return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] };
}

function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16 ml-auto" />
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4 px-5">
        <div className={`rounded-xl p-2.5 ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-lg font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Impact / Revenue Tab ─────────────────────────────────────────────────────

function ImpactTab({ companyId, range }: { companyId: number; range: DateRange }) {
  const { from, to } = getDateRange(range);
  const { data, isLoading } = useApiCall(
    `impact-data-${companyId}-${range}`,
    () => impactService.getImpactData({ companyId, startDate: from, endDate: to })
  );

  const revenueByUnit = data?.coolingUnitUtilization?.map((cu) => ({
    name: cu.name,
    revenue: Math.round(cu.utilizationPercent * 500),
    utilization: cu.utilizationPercent,
  })) ?? [];

  const monthlySeries = data?.monthlySeries?.map((m) => ({
    month: m.month,
    foodSaved: m.foodSavedKg,
    co2: m.co2ReductionKg,
  })) ?? [];

  if (isLoading) return <ChartSkeleton />;
  if (!data) return <div className="text-center py-16 text-gray-400 text-sm">No data for this period</div>;

  const totalRevenue = revenueByUnit.reduce((s, u) => s + u.revenue, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Est. Revenue" value={formatCurrency(totalRevenue, "USD")} icon={DollarSign} color="bg-green-600" />
        <StatCard label="Food Saved (kg)" value={monthlySeries.reduce((s, m) => s + m.foodSaved, 0).toFixed(0)} icon={TrendingUp} color="bg-blue-500" />
        <StatCard label="CO₂ Reduced (kg)" value={monthlySeries.reduce((s, m) => s + m.co2, 0).toFixed(0)} icon={BarChart3} color="bg-emerald-500" />
      </div>

      {revenueByUnit.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Revenue by Cooling Unit</CardTitle></CardHeader>
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
          <CardHeader><CardTitle className="text-sm">Monthly Food Saved & CO₂ Reduction</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlySeries} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="foodSaved" stroke="#16a34a" strokeWidth={2} dot={false} name="Food Saved (kg)" />
                <Line type="monotone" dataKey="co2" stroke="#3b82f6" strokeWidth={2} dot={false} name="CO₂ Reduced (kg)" />
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
    () => impactService.getImpactData({ companyId, startDate: from, endDate: to })
  );

  const utilizationData = data?.coolingUnitUtilization?.map((cu) => ({
    name: cu.name,
    occupancy: Math.round(cu.utilizationPercent),
  })) ?? [];

  if (isLoading) return <ChartSkeleton />;
  if (!utilizationData.length) return <div className="text-center py-16 text-gray-400 text-sm">No utilization data available</div>;

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Occupancy Rate by Cooling Unit (%)</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={utilizationData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} />
            <Tooltip formatter={(v: unknown) => `${v}%`} />
            <Bar dataKey="occupancy" fill="#16a34a" radius={[0, 4, 4, 0]} name="Occupancy" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Usage Analysis Tab ───────────────────────────────────────────────────────

function UsageTab({ coolingUnitIds }: { coolingUnitIds: number[] }) {
  const { data, isLoading } = useApiCall(
    coolingUnitIds.length ? `usage-analysis-${coolingUnitIds.join(",")}` : null,
    () => coldtivateService.getUsageAnalysis({ coolingUnits: coolingUnitIds })
  );

  const movements: Movement[] = data?.results ?? [];

  const inCount = movements.filter((m) => m.type === "IN").length;
  const outCount = movements.filter((m) => m.type === "OUT").length;
  const totalWeight = movements.reduce((s, m) => s + (m.totalWeight ?? 0), 0);

  if (isLoading) return <TableSkeleton />;
  if (!movements.length) return <div className="text-center py-16 text-gray-400 text-sm">No usage data available</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Check-Ins" value={String(inCount)} icon={Activity} color="bg-green-600" />
        <StatCard label="Check-Outs" value={String(outCount)} icon={Package} color="bg-blue-500" />
        <StatCard label="Total Weight (kg)" value={formatWeight(totalWeight)} icon={BarChart3} color="bg-violet-500" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Movement Records</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Cooling Unit</TableHead>
                  <TableHead>Crop</TableHead>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.slice(0, 50).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm tabular-nums">{formatDate(m.createdAt)}</TableCell>
                    <TableCell className="text-sm">{m.coolingUnit?.name ?? "—"}</TableCell>
                    <TableCell className="text-sm">{m.crop?.name ?? "—"}</TableCell>
                    <TableCell className="text-sm">{m.farmer?.user?.firstName} {m.farmer?.user?.lastName}</TableCell>
                    <TableCell className="text-sm tabular-nums">{formatWeight(m.totalWeight ?? 0)}</TableCell>
                    <TableCell>
                      <Badge className={m.type === "IN" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
                        {m.type}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Revenue Analysis Tab ─────────────────────────────────────────────────────

function RevenueAnalysisTab({ coolingUnitIds }: { coolingUnitIds: number[] }) {
  const [paymentMethod, setPaymentMethod] = useState("all");

  const { data, isLoading } = useApiCall(
    coolingUnitIds.length ? `revenue-analysis-${coolingUnitIds.join(",")}-${paymentMethod}` : null,
    () => coldtivateService.getRevenueAnalysis({
      coolingUnits: coolingUnitIds,
      paymentMethods: paymentMethod === "all" ? [] : [paymentMethod],
    })
  );

  const movements: Movement[] = data?.results ?? [];
  const totalAmount = movements.reduce((s, m) => s + (m.totalWeight ?? 0), 0);

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payment Methods</SelectItem>
            <SelectItem value="CASH">Cash</SelectItem>
            <SelectItem value="TRANSFER">Transfer</SelectItem>
            <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
            <SelectItem value="CARD">Card</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Total Weight (kg)" value={formatWeight(totalAmount)} icon={DollarSign} color="bg-green-600" />
        <StatCard label="Transactions" value={String(movements.length)} icon={Activity} color="bg-blue-500" />
      </div>

      {!movements.length ? (
        <div className="text-center py-16 text-gray-400 text-sm">No revenue data available</div>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-sm">Revenue Records</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Cooling Unit</TableHead>
                    <TableHead>Farmer</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.slice(0, 50).map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm tabular-nums">{formatDate(m.createdAt)}</TableCell>
                      <TableCell className="text-sm">{m.coolingUnit?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm">{m.farmer?.user?.firstName} {m.farmer?.user?.lastName}</TableCell>
                      <TableCell className="text-sm">—</TableCell>
                      <TableCell className="text-right text-sm tabular-nums font-medium">
                        {formatWeight(m.totalWeight ?? 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AnalysisPage() {
  const { selectedCompanyId } = useDashboardStore();
  const [range, setRange] = useState<DateRange>("30d");
  const { data: coolingUnits } = useCoolingUnits();

  const companyId = selectedCompanyId ?? 0;
  const coolingUnitIds = (coolingUnits ?? []).map((cu) => cu.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 size={20} className="text-green-600" />
            Revenue & Usage Analysis
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">Track performance across your cooling network</p>
        </div>
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

      {!companyId ? (
        <div className="text-center py-16 text-gray-400 text-sm">No company selected. Please select a company from the dashboard.</div>
      ) : (
        <Tabs defaultValue="impact">
          <TabsList className="mb-4">
            <TabsTrigger value="impact" className="gap-1.5"><DollarSign size={14} />Impact</TabsTrigger>
            <TabsTrigger value="utilization" className="gap-1.5"><TrendingUp size={14} />Utilization</TabsTrigger>
            <TabsTrigger value="usage" className="gap-1.5"><Activity size={14} />Usage</TabsTrigger>
            <TabsTrigger value="revenue" className="gap-1.5"><BarChart3 size={14} />Revenue</TabsTrigger>
          </TabsList>

          <TabsContent value="impact"><ImpactTab companyId={companyId} range={range} /></TabsContent>
          <TabsContent value="utilization"><UtilizationTab companyId={companyId} range={range} /></TabsContent>
          <TabsContent value="usage"><UsageTab coolingUnitIds={coolingUnitIds} /></TabsContent>
          <TabsContent value="revenue"><RevenueAnalysisTab coolingUnitIds={coolingUnitIds} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}
