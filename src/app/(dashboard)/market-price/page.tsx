"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/auth";
import { TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { coldtivateService } from "@/services/coldtivate-service";
import { PredictionGraphData, PredictionParams } from "@/types/global";
import { formatDate } from "@/lib/utils";

function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-40" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}

function PriceChart({ data }: { data: PredictionGraphData }) {
  const mergedMap: Record<string, { date: string; actual?: number; predicted?: number }> = {};
  data.series.forEach((d) => {
    if (!mergedMap[d.date]) mergedMap[d.date] = { date: d.date };
    if (d.predicted) mergedMap[d.date].predicted = d.price;
    else mergedMap[d.date].actual = d.price;
  });
  const chartData = Object.values(mergedMap).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => {
            try {
              return new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            } catch {
              return v;
            }
          }}
        />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value, name) => [
            typeof value === "number" ? value.toFixed(2) : String(value ?? ""),
            name === "actual" ? "Actual Price" : "Predicted Price",
          ]}
          labelFormatter={(label) => {
            try {
              return formatDate(label);
            } catch {
              return label;
            }
          }}
        />
        <Legend
          formatter={(v) => (v === "actual" ? "Actual Price" : "Predicted Price")}
        />
        <Line
          type="monotone"
          dataKey="actual"
          stroke="#16a34a"
          strokeWidth={2}
          dot={false}
          name="actual"
        />
        <Line
          type="monotone"
          dataKey="predicted"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          name="predicted"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function PriceTable({ data }: { data: PredictionGraphData }) {
  const rows = data.series.slice().sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-center">Predicted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.date}>
              <TableCell className="text-sm">{formatDate(row.date)}</TableCell>
              <TableCell className="text-right text-sm font-medium">{row.price.toFixed(2)}</TableCell>
              <TableCell className="text-center">
                {row.predicted ? (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 border text-xs">
                    Yes
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-600 border-gray-200 border text-xs">
                    No
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RegionPanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [params, setParams] = useState<PredictionParams | null>(null);
  const [paramsLoading, setParamsLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [graphData, setGraphData] = useState<PredictionGraphData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  const fetchParams = useCallback(async () => {
    setParamsLoading(true);
    try {
      const result = await coldtivateService.getPredictionParamsNigeria();
      setParams(result);
      if (result.crops[0]) setSelectedCrop(result.crops[0]);
      if (result.states[0]) setSelectedState(result.states[0]);
    } catch {
      // silently fail
    } finally {
      setParamsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchParams();
  }, [fetchParams, isAuthenticated]);

  const fetchGraph = useCallback(async () => {
    if (!selectedCrop || !selectedState) return;
    setDataLoading(true);
    try {
      const result = await coldtivateService.getPredictionGraphNigeria({
        crop: selectedCrop,
        state: selectedState,
      });
      setGraphData(result);
    } catch {
      setGraphData(null);
    } finally {
      setDataLoading(false);
    }
  }, [selectedCrop, selectedState]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  if (paramsLoading) return <ChartSkeleton />;

  return (
    <div className="space-y-4">
      {/* Selectors */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select
          value={selectedCrop}
          onValueChange={(v) => { if (v) setSelectedCrop(v); }}
          disabled={!params?.crops?.length}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Select crop" />
          </SelectTrigger>
          <SelectContent>
            {params?.crops?.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedState}
          onValueChange={(v) => { if (v) setSelectedState(v); }}
          disabled={!params?.states?.length}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Select state/region" />
          </SelectTrigger>
          <SelectContent>
            {params?.states?.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-2">
          <button
            className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${
              viewMode === "chart"
                ? "bg-green-600 text-white border-green-600"
                : "border-border hover:bg-muted"
            }`}
            onClick={() => setViewMode("chart")}
          >
            Chart
          </button>
          <button
            className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${
              viewMode === "table"
                ? "bg-green-600 text-white border-green-600"
                : "border-border hover:bg-muted"
            }`}
            onClick={() => setViewMode("table")}
          >
            Table
          </button>
        </div>
      </div>

      {/* Content */}
      {dataLoading && <Skeleton className="h-72 w-full rounded-xl" />}

      {!dataLoading && graphData && viewMode === "chart" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <TrendingUp size={14} />
              {graphData.crop} · {graphData.state}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PriceChart data={graphData} />
          </CardContent>
        </Card>
      )}

      {!dataLoading && graphData && viewMode === "table" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <TrendingUp size={14} />
              {graphData.crop} · {graphData.state}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <PriceTable data={graphData} />
          </CardContent>
        </Card>
      )}

      {!dataLoading && !graphData && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <TrendingUp className="text-muted-foreground mb-3" size={40} />
            <h3 className="font-semibold mb-1">No data available</h3>
            <p className="text-sm text-muted-foreground">
              Select a crop and region to view price predictions
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function MarketPricePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp size={20} className="text-green-600" />
          Market Price Predictions
        </h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          AI-powered crop price forecasts for Nigeria
        </p>
      </div>

      <RegionPanel />
    </div>
  );
}
