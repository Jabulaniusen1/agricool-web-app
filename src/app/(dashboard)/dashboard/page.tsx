"use client";

import { useState } from "react";
import {
  Package,
  Thermometer,
  Clock,
  Star,
  Plus,
  ArrowUpRight,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

import { useProduces } from "@/hooks/use-produces";
import { useCoolingUnits } from "@/hooks/use-cooling-units";
import { useDashboardStore } from "@/stores/dashboard";
import { useAuthStore } from "@/stores/auth";
import { DashboardProduce, ERoles } from "@/types/global";
import { formatWeight, formatDate, cn, getInitials } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";

function QualityBadge({ quality }: { quality: number }) {
  const color =
    quality >= 80 ? "bg-green-100 text-green-700" :
    quality >= 60 ? "bg-yellow-100 text-yellow-700" :
    "bg-red-100 text-red-700";

  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", color)}>
      {quality}%
    </span>
  );
}

function ProduceCard({ produce, onCheckOut }: { produce: DashboardProduce; onCheckOut?: () => void }) {
  const shelfLifePercent = Math.min(100, (produce.minimumRemainingShelfLife / 30) * 100);

  return (
    <Card className="hover:shadow-lg hover:border-green-200 dark:hover:border-green-800/40 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center overflow-hidden">
              {produce.cropImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={produce.cropImage} alt={produce.cropName} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <Package className="text-green-600" size={20} />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{produce.cropName}</h3>
              <p className="text-xs text-muted-foreground">{produce.movementCode}</p>
            </div>
          </div>
          {produce.hasDigitalTwin && (
            <Badge variant="outline" className="text-xs shrink-0 border-blue-300 text-blue-600">
              Digital Twin
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Owner */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] bg-gray-100">
              {getInitials(produce.owner)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs font-medium">{produce.owner}</p>
            <p className="text-xs text-muted-foreground">{produce.ownerContact}</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-green-50/60 dark:bg-green-900/10 rounded-lg">
            <p className="text-sm font-bold">{produce.cratesAmount}</p>
            <p className="text-xs text-muted-foreground">Crates</p>
          </div>
          <div className="text-center p-2 bg-green-50/60 dark:bg-green-900/10 rounded-lg">
            <p className="text-sm font-bold">{formatWeight(produce.cratesCombinedWeight)}</p>
            <p className="text-xs text-muted-foreground">Weight</p>
          </div>
          <div className="text-center p-2 bg-green-50/60 dark:bg-green-900/10 rounded-lg">
            <div className="flex items-center justify-center gap-1">
              <Clock size={12} className="text-muted-foreground" />
              <p className="text-sm font-bold">{produce.currentStorageDays}d</p>
            </div>
            <p className="text-xs text-muted-foreground">Stored</p>
          </div>
        </div>

        {/* Shelf life */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Shelf Life</span>
            <span className="font-medium">{produce.minimumRemainingShelfLife} days left</span>
          </div>
          <Progress
            value={shelfLifePercent}
            className={cn(
              "h-2 rounded-full",
              shelfLifePercent > 50 ? "[&>div]:bg-green-500" :
              shelfLifePercent > 25 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"
            )}
          />
        </div>

        {/* Quality */}
        {produce.hasDigitalTwin && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Star size={11} /> Quality
            </span>
            <QualityBadge quality={produce.qualityDt} />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <LinkButton
            href={ROUTES.COOLING_UNITS}
            size="sm"
            variant="outline"
            className="flex-1 text-xs h-8"
          >
            View Details
          </LinkButton>
          {onCheckOut && (
            <Button
              size="sm"
              className="flex-1 text-xs h-8 bg-green-600 hover:bg-green-700"
              onClick={onCheckOut}
            >
              Check Out
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ProduceCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { selectedCoolingUnitId, setSelectedCoolingUnit } = useDashboardStore();
  const { data: coolingUnits, isLoading: cuLoading } = useCoolingUnits();
  const { data: produces, isLoading: producesLoading, mutate } = useProduces(selectedCoolingUnitId);
  const [checkOutProduceId, setCheckOutProduceId] = useState<number | null>(null);

  const role = user?.role;
  const isOperator = role === ERoles.OPERATOR || role === ERoles.SERVICE_PROVIDER;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
            {user?.firstName}!
          </h2>
          <p className="text-muted-foreground text-sm">
            {produces?.length ?? 0} produce{produces?.length !== 1 ? "s" : ""} in storage
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Cooling unit selector */}
          <Select
            value={selectedCoolingUnitId?.toString() ?? ""}
            onValueChange={(v) => setSelectedCoolingUnit(v ? Number(v) : null)}
          >
            <SelectTrigger className="w-48">
              <Thermometer size={14} className="text-muted-foreground mr-1" />
              <SelectValue placeholder="Select cooling unit" />
            </SelectTrigger>
            <SelectContent>
              {coolingUnits?.map((cu) => (
                <SelectItem key={cu.id} value={cu.id.toString()}>
                  {cu.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => mutate()}
            disabled={producesLoading}
          >
            <RefreshCw size={16} className={producesLoading ? "animate-spin" : ""} />
          </Button>

          {isOperator && (
            <LinkButton href={`${ROUTES.DASHBOARD}/check-in`} className="bg-green-600 hover:bg-green-700 gap-1.5" size="sm">
              <Plus size={16} />
              Check In
            </LinkButton>
          )}
        </div>
      </div>

      {/* Summary stats */}
      {produces && produces.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Total Produces",
              value: produces.length,
              icon: Package,
              color: "text-green-600 bg-green-50 dark:bg-green-900/20",
              accent: "border-t-green-500",
            },
            {
              label: "Total Weight",
              value: formatWeight(produces.reduce((s, p) => s + p.cratesCombinedWeight, 0)),
              icon: ChevronDown,
              color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
              accent: "border-t-blue-500",
            },
            {
              label: "Total Crates",
              value: produces.reduce((s, p) => s + p.cratesAmount, 0),
              icon: Package,
              color: "text-violet-600 bg-violet-50 dark:bg-violet-900/20",
              accent: "border-t-violet-500",
            },
            {
              label: "Avg. Storage Days",
              value: `${Math.round(produces.reduce((s, p) => s + p.currentStorageDays, 0) / produces.length)}d`,
              icon: Clock,
              color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
              accent: "border-t-amber-500",
            },
          ].map((stat) => (
            <Card key={stat.label} className={cn("border-t-2", stat.accent)}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", stat.color)}>
                  <stat.icon size={19} />
                </div>
                <div>
                  <p className="text-xl font-bold tracking-tight leading-none mb-0.5">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No cooling unit selected */}
      {!selectedCoolingUnitId && !cuLoading && (
        <Card className="border-dashed bg-linear-to-br from-green-50/40 to-emerald-50/30 dark:from-green-900/5 dark:to-emerald-900/5">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Thermometer className="text-muted-foreground mb-3" size={40} />
            <h3 className="font-semibold mb-1">Select a Cooling Unit</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose a cooling unit from the selector above to view its produces
            </p>
            <LinkButton href={ROUTES.COOLING_UNITS} variant="outline">
              View all cooling units
              <ArrowUpRight size={14} className="ml-1" />
            </LinkButton>
          </CardContent>
        </Card>
      )}

      {/* Produces grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {producesLoading &&
          [1, 2, 3].map((i) => <ProduceCardSkeleton key={i} />)}

        {!producesLoading && produces?.length === 0 && selectedCoolingUnitId && (
          <div className="col-span-full">
            <Card className="border-dashed bg-linear-to-br from-green-50/40 to-emerald-50/30 dark:from-green-900/5 dark:to-emerald-900/5">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="text-muted-foreground mb-3" size={40} />
                <h3 className="font-semibold mb-1">No produces in storage</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This cooling unit is currently empty
                </p>
                {isOperator && (
                  <LinkButton href={`${ROUTES.DASHBOARD}/check-in`} className="bg-green-600 hover:bg-green-700">
                    <Plus size={14} className="mr-2" />
                    Check In Produce
                  </LinkButton>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {produces?.map((produce) => (
          <ProduceCard
            key={produce.id}
            produce={produce}
            onCheckOut={isOperator ? () => setCheckOutProduceId(produce.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
