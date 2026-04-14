"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Crop, PredictionState, PredictionMarket, PredictionGraphData } from "@/types/global";
import { formatDate } from "@/lib/utils";

// ─── Chart ────────────────────────────────────────────────────────────────────

function PriceChart({ data }: { data: PredictionGraphData }) {
  const chartData = [
    ...data.pastValues
      .filter((d) => d.price !== null)
      .map((d) => ({ date: d.date, actual: d.price, predicted: undefined })),
    ...data.forecastValues
      .filter((d) => d.price !== null)
      .map((d) => ({ date: d.date, actual: undefined, predicted: d.price })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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
        <YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={(v) => `₦${v}`} />
        <Tooltip
          formatter={(value, name) => [
            typeof value === "number" ? `₦${value.toFixed(2)}` : "—",
            name === "actual" ? "Actual Price" : "Forecast Price",
          ]}
          labelFormatter={(label) => {
            try { return formatDate(label); } catch { return label; }
          }}
        />
        <Legend formatter={(v) => (v === "actual" ? "Actual Price" : "Forecast Price")} />
        <Line type="monotone" dataKey="actual" stroke="#16a34a" strokeWidth={2} dot={false} name="actual" connectNulls />
        <Line type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} name="predicted" connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

function PriceTable({ data }: { data: PredictionGraphData }) {
  const rows = [
    ...data.pastValues.map((d) => ({ ...d, isForecast: false })),
    ...data.forecastValues.map((d) => ({ ...d, isForecast: true })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Price (₦)</TableHead>
            <TableHead className="text-center">Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              <TableCell className="text-sm">{formatDate(row.date)}</TableCell>
              <TableCell className="text-right text-sm font-medium">
                {row.price !== null ? row.price.toFixed(2) : "—"}
              </TableCell>
              <TableCell className="text-center">
                {row.isForecast ? (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 border text-xs">Forecast</Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-700 border-green-200 border text-xs">Actual</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MarketPricePage() {
  // Data
  const [crops, setCrops] = useState<Crop[]>([]);
  const [states, setStates] = useState<PredictionState[]>([]);
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [graphData, setGraphData] = useState<PredictionGraphData | null>(null);

  // Selections
  const [selectedCropId, setSelectedCropId] = useState<string>("");
  const [selectedStateId, setSelectedStateId] = useState<string>("");
  const [selectedMarketId, setSelectedMarketId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  // Loading states
  const [initLoading, setInitLoading] = useState(true);
  const [marketsLoading, setMarketsLoading] = useState(false);
  const [graphLoading, setGraphLoading] = useState(false);

  // Load crops + states on mount
  useEffect(() => {
    async function loadInit() {
      setInitLoading(true);
      try {
        const [cropsRes, statesRes] = await Promise.all([
          coldtivateService.getCrops(),
          coldtivateService.getPredictionStatesNg(),
        ]);
        setCrops(cropsRes);
        setStates(statesRes);
        if (cropsRes[0]) setSelectedCropId(String(cropsRes[0].id));
        if (statesRes[0]) setSelectedStateId(String(statesRes[0].id));
      } catch {
        // silently fail
      } finally {
        setInitLoading(false);
      }
    }
    loadInit();
  }, []);

  // Load markets when state changes
  useEffect(() => {
    if (!selectedStateId) return;
    setMarkets([]);
    setSelectedMarketId("");
    setGraphData(null);
    setMarketsLoading(true);
    coldtivateService
      .getPredictionMarkets({ state: Number(selectedStateId), country: "NG" })
      .then((res) => {
        setMarkets(res);
        if (res[0]) setSelectedMarketId(String(res[0].id));
      })
      .catch(() => {})
      .finally(() => setMarketsLoading(false));
  }, [selectedStateId]);

  // Fetch graph when crop + market are selected
  const fetchGraph = useCallback(async () => {
    if (!selectedCropId || !selectedMarketId) return;
    setGraphLoading(true);
    setGraphData(null);
    try {
      const res = await coldtivateService.getPredictionGraphNigeria({
        cropId: Number(selectedCropId),
        marketId: Number(selectedMarketId),
      });
      setGraphData(res);
    } catch {
      setGraphData(null);
    } finally {
      setGraphLoading(false);
    }
  }, [selectedCropId, selectedMarketId]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  const hasData = graphData && (graphData.pastValues.length > 0 || graphData.forecastValues.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp size={20} className="text-green-600" />
          Commodity Price Predictions
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          AI-powered commodity price forecasts for Nigerian markets
        </p>
      </div>

      {/* Filters */}
      {initLoading ? (
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-9 w-44" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Selectors row */}
          <div className="flex flex-wrap gap-3">
            {/* Crop */}
            <Select
              value={selectedCropId}
              onValueChange={(v) => { if (v) setSelectedCropId(v); }}
              disabled={crops.length === 0}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Select crop" />
              </SelectTrigger>
              <SelectContent>
                {crops.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* State */}
            <Select
              value={selectedStateId}
              onValueChange={(v) => { if (v) setSelectedStateId(v); }}
              disabled={states.length === 0}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Market */}
            <Select
              value={selectedMarketId}
              onValueChange={(v) => { if (v) setSelectedMarketId(v); }}
              disabled={marketsLoading || markets.length === 0}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder={marketsLoading ? "Loading..." : "Select market"} />
              </SelectTrigger>
              <SelectContent>
                {markets.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* View toggle */}
          <div className="flex gap-2">
            <button
              className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${
                viewMode === "chart" ? "bg-green-600 text-white border-green-600" : "border-gray-200 hover:bg-gray-100 text-gray-700"
              }`}
              onClick={() => setViewMode("chart")}
            >
              Chart
            </button>
            <button
              className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${
                viewMode === "table" ? "bg-green-600 text-white border-green-600" : "border-gray-200 hover:bg-gray-100 text-gray-700"
              }`}
              onClick={() => setViewMode("table")}
            >
              Table
            </button>
          </div>
        </div>
      )}

      {/* Graph / Table */}
      {graphLoading && <Skeleton className="h-72 w-full rounded-xl" />}

      {!graphLoading && hasData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-500">
              <TrendingUp size={14} />
              {crops.find((c) => String(c.id) === selectedCropId)?.name ?? "Crop"} ·{" "}
              {markets.find((m) => String(m.id) === selectedMarketId)?.name ?? "Market"}
              <span className="ml-auto text-xs text-gray-400">Past 28 days + 14-day forecast</span>
            </CardTitle>
          </CardHeader>
          <CardContent className={viewMode === "table" ? "p-0" : undefined}>
            {viewMode === "chart" ? (
              <PriceChart data={graphData!} />
            ) : (
              <PriceTable data={graphData!} />
            )}
          </CardContent>
        </Card>
      )}

      {!graphLoading && !hasData && !initLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <TrendingUp className="text-gray-300 mb-3" size={40} />
            <h3 className="font-semibold mb-1">No data available</h3>
            <p className="text-sm text-gray-500">
              {!selectedMarketId ? "Select a crop, state, and market to view predictions" : "No prediction data for this combination"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
