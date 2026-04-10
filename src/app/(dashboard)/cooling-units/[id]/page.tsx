"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Thermometer, Box, Leaf, AlertTriangle, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  useCoolingUnit,
  useCoolingUnitTemperatures,
  useCoolingUnitCapacity,
} from "@/hooks/use-cooling-units";
import { ECoolingUnitType } from "@/types/global";
import { formatTemperature, formatPercent, formatDate, cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";

type Period = "24h" | "7d" | "30d";

function getPeriodDates(period: Period): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (period === "24h") from.setHours(from.getHours() - 24);
  else if (period === "7d") from.setDate(from.getDate() - 7);
  else from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

function coolingUnitTypeLabel(type: ECoolingUnitType): string {
  const labels: Record<ECoolingUnitType, string> = {
    [ECoolingUnitType.FARM_GATE_STORAGE_ROOM]: "Farm-gate Storage Room",
    [ECoolingUnitType.MARKET_STORAGE_ROOM]: "Market Storage Room",
    [ECoolingUnitType.MOVABLE_UNIT]: "Movable Unit",
    [ECoolingUnitType.OTHER]: "Other",
  };
  return labels[type] ?? type;
}

function temperatureColor(temp: number | null): string {
  if (temp < 5) return "text-blue-600";
  if (temp <= 25) return "text-green-600";
  return "text-orange-500";
}

export default function CoolingUnitDetailPage() {
  const params = useParams();
  const id = params?.id ? Number(params.id) : null;

  const [period, setPeriod] = useState<Period>("24h");
  const periodDates = getPeriodDates(period);

  const { data: unit, isLoading: unitLoading } = useCoolingUnit(id);
  const { data: temperatures, isLoading: tempLoading } = useCoolingUnitTemperatures({
    coolingUnitId: id,
    from: periodDates.from,
    to: periodDates.to,
  });
  const { data: capacity, isLoading: capacityLoading } = useCoolingUnitCapacity(id);

  const capacityPercent =
    capacity && capacity.totalCapacity > 0
      ? Math.min(100, (capacity.usedCapacity / capacity.totalCapacity) * 100)
      : 0;

  const chartData = temperatures?.map((t) => ({
    time: formatDate(t.timestamp, "MMM d HH:mm"),
    temperature: t.temperature,
    humidity: t.humidity,
  })) ?? [];

  if (!unitLoading && !unit) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Box className="text-muted-foreground mb-3" size={40} />
        <h3 className="font-semibold mb-1">Cooling unit not found</h3>
        <Link
          href={ROUTES.COOLING_UNITS}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          <ArrowLeft size={14} />
          Back to Cooling Units
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Link
          href={ROUTES.COOLING_UNITS}
          className="inline-flex size-8 items-center justify-center rounded-lg text-sm transition-colors hover:bg-muted"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          {unitLoading ? (
            <Skeleton className="h-6 w-48" />
          ) : (
            <h2 className="text-xl font-bold truncate">{unit?.name}</h2>
          )}
          {unitLoading ? (
            <Skeleton className="h-4 w-32 mt-1" />
          ) : (
            <p className="text-sm text-muted-foreground">
              {coolingUnitTypeLabel(unit!.coolingUnitType)}
            </p>
          )}
        </div>
        {!unitLoading && unit && (
          <div className="flex gap-2">
            {unit.sensor && (
              unit.sensorError ? (
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100 gap-1">
                  <AlertTriangle size={11} />
                  Sensor Error
                </Badge>
              ) : (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
                  <Activity size={11} />
                  Sensor Active
                </Badge>
              )
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="temperature">Temperature</TabsTrigger>
          <TabsTrigger value="sensor">Sensor</TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Capacity card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <Box size={14} />
                  Capacity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {capacityLoading ? (
                  <>
                    <Skeleton className="h-8 w-28" />
                    <Skeleton className="h-2 w-full" />
                  </>
                ) : capacity ? (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">{capacity.usedCapacity}</span>
                      <span className="text-muted-foreground">/ {capacity.totalCapacity}</span>
                      <span className="text-sm text-muted-foreground ml-1">{capacity.metric}</span>
                    </div>
                    <Progress
                      value={capacityPercent}
                      className={cn(
                        "h-2",
                        capacityPercent > 90
                          ? "[&>div]:bg-red-500"
                          : capacityPercent > 70
                          ? "[&>div]:bg-orange-500"
                          : "[&>div]:bg-green-500"
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatPercent(capacityPercent)} used &bull; {capacity.availableCapacity} available
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No capacity data</p>
                )}
              </CardContent>
            </Card>

            {/* Latest temperature card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <Thermometer size={14} />
                  Latest Temperature
                </CardTitle>
              </CardHeader>
              <CardContent>
                {unitLoading ? (
                  <Skeleton className="h-10 w-24" />
                ) : (
                  <p
                    className={cn(
                      "text-3xl font-bold",
                      unit!.latestTemperature != null ? temperatureColor(unit!.latestTemperature) : ""
                    )}
                  >
                    {formatTemperature(unit!.latestTemperature)}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Crops */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Leaf size={14} />
                Stored Crops
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unitLoading ? (
                <div className="flex gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-7 w-20 rounded-full" />
                  ))}
                </div>
              ) : unit && unit.crops.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {unit.crops.map((crop) => (
                    <Badge key={crop.id} variant="secondary" className="gap-1.5 py-1 px-3">
                      {crop.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={crop.image}
                          alt={crop.name}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                      )}
                      {crop.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No crops stored</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Temperature ── */}
        <TabsContent value="temperature" className="space-y-4 mt-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold">Temperature History</h3>
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="pt-6">
              {tempLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-[280px] w-full" />
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}°C`}
                    />
                    <Tooltip
                      formatter={(value: unknown) => [`${value as number}°C`, "Temperature"]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      stroke="#16a34a"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: "#16a34a" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[280px] text-center">
                  <Thermometer className="text-muted-foreground mb-2" size={32} />
                  <p className="text-sm text-muted-foreground">
                    No temperature data for the selected period
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Sensor ── */}
        <TabsContent value="sensor" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity size={16} />
                Sensor Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unitLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : unit ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted space-y-1">
                      <p className="text-xs text-muted-foreground">Sensor Enabled</p>
                      <p className="font-semibold">{unit.sensor ? "Yes" : "No"}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted space-y-1">
                      <p className="text-xs text-muted-foreground">Sensor Status</p>
                      <div>
                        {unit.sensor ? (
                          unit.sensorError ? (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 gap-1">
                              <AlertTriangle size={11} />
                              Error
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              Active
                            </Badge>
                          )
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            N/A
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted space-y-1">
                      <p className="text-xs text-muted-foreground">Latest Temperature</p>
                      <p className={cn("font-semibold", unit.latestTemperature != null ? temperatureColor(unit.latestTemperature) : "")}>
                        {formatTemperature(unit.latestTemperature)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted space-y-1">
                      <p className="text-xs text-muted-foreground">Sensors Count</p>
                      <p className="font-semibold">{unit.sensorList.length}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
