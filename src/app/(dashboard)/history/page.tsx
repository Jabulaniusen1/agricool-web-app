"use client";

import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Download, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Skeleton } from "@/components/ui/skeleton";

import { useMovements } from "@/hooks/use-movements";
import { useCoolingUnits } from "@/hooks/use-cooling-units";
import { Movement } from "@/types/global";
import { formatDate, formatWeight, downloadCsv } from "@/lib/utils";

const PAGE_SIZE = 20;

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-5 w-12 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

function MovementTypeBadge({ type }: { type: "IN" | "OUT" }) {
  if (type === "IN") {
    return (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1 text-xs">
        <ArrowDownToLine size={10} />
        IN
      </Badge>
    );
  }
  return (
    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 gap-1 text-xs">
      <ArrowUpFromLine size={10} />
      OUT
    </Badge>
  );
}

function movementToCsvRow(m: Movement): Record<string, unknown> {
  return {
    Date: formatDate(m.createdAt),
    Farmer: `${m.farmer.user.firstName} ${m.farmer.user.lastName}`,
    Crop: m.crop.name,
    "Cooling Unit": m.coolingUnit.name,
    Crates: m.cratesCount,
    Weight: formatWeight(m.totalWeight),
    Type: m.type,
    "Movement Code": m.movementCode,
  };
}

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [coolingUnitFilter, setCoolingUnitFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "IN" | "OUT">("all");

  const { data: coolingUnits } = useCoolingUnits();

  const queryParams = {
    page,
    pageSize: PAGE_SIZE,
    ...(dateFrom ? { from: dateFrom } : {}),
    ...(dateTo ? { to: dateTo } : {}),
    ...(coolingUnitFilter !== "all" ? { coolingUnitId: Number(coolingUnitFilter) } : {}),
  };

  const { data: movementsData, isLoading } = useMovements(queryParams);

  // The movements hook may return PaginatedResponse or array depending on the service
  // Treat as either shape gracefully
  const rawData = movementsData as unknown;
  const isPaginated =
    rawData !== null &&
    typeof rawData === "object" &&
    "results" in (rawData as object);

  const allMovements: Movement[] = isPaginated
    ? (rawData as { results: Movement[] }).results
    : Array.isArray(rawData)
    ? (rawData as Movement[])
    : [];

  const totalCount: number = isPaginated
    ? (rawData as { count: number }).count
    : allMovements.length;

  // Client-side type filter (API may not support it)
  const movements =
    typeFilter === "all"
      ? allMovements
      : allMovements.filter((m) => m.type === typeFilter);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  function handleExport() {
    if (!movements.length) return;
    downloadCsv(movements.map(movementToCsvRow), `movements-page-${page}.csv`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Movement History</h2>
          <p className="text-sm text-muted-foreground">
            {totalCount > 0 ? `${totalCount} total movements` : "No movements recorded"}
          </p>
        </div>

        <Button
          variant="outline"
          className="gap-1.5 self-start sm:self-auto"
          onClick={handleExport}
          disabled={!movements.length}
        >
          <Download size={15} />
          Export CSV
        </Button>
      </div>

      {/* Filter bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
            <Filter size={14} />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Date from */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              />
            </div>

            {/* Date to */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              />
            </div>

            {/* Cooling unit filter */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Cooling Unit</label>
              <Select
                value={coolingUnitFilter}
                onValueChange={(v) => { setCoolingUnitFilter(v ?? "all"); setPage(1); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All units</SelectItem>
                  {coolingUnits?.map((cu) => (
                    <SelectItem key={cu.id} value={cu.id.toString()}>
                      {cu.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type filter */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Type</label>
              <Select
                value={typeFilter}
                onValueChange={(v) => { setTypeFilter((v ?? "all") as "all" | "IN" | "OUT"); setPage(1); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="IN">Check-In</SelectItem>
                  <SelectItem value="OUT">Check-Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Date</TableHead>
              <TableHead className="whitespace-nowrap">Farmer</TableHead>
              <TableHead className="whitespace-nowrap">Crop</TableHead>
              <TableHead className="whitespace-nowrap">Cooling Unit</TableHead>
              <TableHead className="whitespace-nowrap text-right">Crates</TableHead>
              <TableHead className="whitespace-nowrap text-right">Weight</TableHead>
              <TableHead className="whitespace-nowrap">Type</TableHead>
              <TableHead className="whitespace-nowrap">Movement Code</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <SkeletonRows />}

            {!isLoading && movements.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ArrowDownToLine size={32} />
                    <p className="text-sm font-medium">No movements found</p>
                    <p className="text-xs">Try adjusting the filters above</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              movements.map((movement) => (
                <TableRow key={movement.id} className="hover:bg-muted/50">
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDate(movement.createdAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {movement.farmer.user.firstName} {movement.farmer.user.lastName}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {movement.crop.name}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {movement.coolingUnit.name}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-right">
                    {movement.cratesCount}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-right">
                    {formatWeight(movement.totalWeight)}
                  </TableCell>
                  <TableCell>
                    <MovementTypeBadge type={movement.type} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm font-mono text-muted-foreground">
                    {movement.movementCode}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
