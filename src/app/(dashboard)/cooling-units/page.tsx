"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Thermometer,
  MapPin,
  Box,
  AlertTriangle,
  Plus,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

import { useCoolingUnits } from "@/hooks/use-cooling-units";
import { useLocations } from "@/hooks/use-locations";
import { CoolingUnit, ECoolingUnitType } from "@/types/global";
import { formatTemperature, formatPercent, cn, debounce } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";

function temperatureColor(temp: number | null): string {
  if (temp < 5) return "text-blue-600";
  if (temp <= 25) return "text-green-600";
  return "text-orange-500";
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

function CoolingUnitCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function CoolingUnitCard({ unit, locationName }: { unit: CoolingUnit; locationName: string }) {
  const occupancyPercent = unit.capacityInNumberCrates > 0
    ? Math.min(100, (unit.occupancy / unit.capacityInNumberCrates) * 100)
    : 0;

  return (
    <Link href={ROUTES.COOLING_UNIT_DETAIL(unit.id)} className="block group">
      <Card className="h-full hover:shadow-md transition-shadow group-hover:border-green-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold leading-tight">
              {unit.name}
            </CardTitle>
            <Badge variant="outline" className="shrink-0 text-xs">
              {coolingUnitTypeLabel(unit.coolingUnitType)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Location */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin size={13} />
            <span className="truncate">{locationName}</span>
          </div>

          {/* Temperature */}
          <div className="flex items-center gap-2">
            <Thermometer size={16} className={unit.latestTemperature != null ? temperatureColor(unit.latestTemperature) : "text-muted-foreground"} />
            <span className={cn("text-lg font-bold", unit.latestTemperature != null ? temperatureColor(unit.latestTemperature) : "text-muted-foreground")}>
              {formatTemperature(unit.latestTemperature)}
            </span>
          </div>

          {/* Occupancy */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <Box size={11} />
                Occupancy
              </span>
              <span className="font-medium">
                {unit.occupancy} / {unit.capacityInNumberCrates} crates
              </span>
            </div>
            <Progress
              value={occupancyPercent}
              className={cn(
                "h-1.5",
                occupancyPercent > 90
                  ? "[&>div]:bg-red-500"
                  : occupancyPercent > 70
                  ? "[&>div]:bg-orange-500"
                  : "[&>div]:bg-green-500"
              )}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formatPercent(occupancyPercent)} full
            </p>
          </div>

          {/* Sensor status */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Sensor</span>
            {unit.sensor ? (
              unit.sensorError ? (
                <Badge className="text-xs bg-red-100 text-red-700 hover:bg-red-100 gap-1">
                  <AlertTriangle size={10} />
                  Error
                </Badge>
              ) : (
                <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                  Active
                </Badge>
              )
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                No sensor
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function CoolingUnitsPage() {
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const { data: locations, isLoading: locationsLoading } = useLocations();
  const { data: coolingUnits, isLoading: unitsLoading } = useCoolingUnits(
    locationFilter !== "all" ? { locationId: Number(locationFilter) } : undefined
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearchDebounced = useCallback(
    debounce((value: unknown) => {
      setDebouncedSearch(value as string);
    }, 300),
    []
  );

  useEffect(() => {
    handleSearchDebounced(searchQuery);
  }, [searchQuery, handleSearchDebounced]);

  const locationMap = new Map(locations?.map((l) => [l.id, l.name]) ?? []);

  const filteredUnits = coolingUnits?.filter((unit) => {
    if (!debouncedSearch) return true;
    return unit.name.toLowerCase().includes(debouncedSearch.toLowerCase());
  });

  const isLoading = unitsLoading || locationsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Cooling Units</h2>
          <p className="text-sm text-muted-foreground">
            {filteredUnits?.length ?? 0} unit{filteredUnits?.length !== 1 ? "s" : ""} found
          </p>
        </div>

        <Link
          href={ROUTES.MANAGEMENT_COOLING_UNITS}
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700 sm:self-auto"
        >
          <Plus size={16} />
          Add Cooling Unit
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search by name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Location filter */}
        <Select value={locationFilter} onValueChange={(v) => setLocationFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-52">
            <MapPin size={14} className="mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="All locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {locations?.map((location) => (
              <SelectItem key={location.id} value={location.id.toString()}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => <CoolingUnitCardSkeleton key={i} />)}

        {!isLoading && filteredUnits?.length === 0 && (
          <div className="col-span-full">
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Box className="text-muted-foreground mb-3" size={40} />
                <h3 className="font-semibold mb-1">No cooling units found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {debouncedSearch
                    ? `No results for "${debouncedSearch}"`
                    : "No cooling units match the selected filters."}
                </p>
                <Link
                  href={ROUTES.MANAGEMENT_COOLING_UNITS}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <Plus size={14} />
                  Add Cooling Unit
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {!isLoading &&
          filteredUnits?.map((unit) => (
            <CoolingUnitCard
              key={unit.id}
              unit={unit}
              locationName={locationMap.get(unit.location) ?? "Unknown location"}
            />
          ))}
      </div>
    </div>
  );
}
