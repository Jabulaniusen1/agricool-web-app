"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Download,
  Filter,
  Edit,
  MessageSquare,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useMovements } from "@/hooks/use-movements";
import { useCoolingUnits } from "@/hooks/use-cooling-units";
import { coldtivateService } from "@/services/coldtivate-service";
import { Movement } from "@/types/global";
import { formatDate, formatWeight, downloadCsv } from "@/lib/utils";

const PAGE_SIZE = 20;

// ─── Schemas ───────────────────────────────────────────────────────────────────

const editCheckInSchema = z.object({
  notes: z.string().optional(),
});
type EditCheckInValues = z.infer<typeof editCheckInSchema>;

// ─── Skeletons ─────────────────────────────────────────────────────────────────

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
          <TableCell><Skeleton className="h-8 w-16" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ─── Type Badge ────────────────────────────────────────────────────────────────

function MovementTypeBadge({ type }: { type: "IN" | "OUT" }) {
  if (type === "IN") {
    return (
      <Badge className="bg-green-100 text-green-700 gap-1 text-xs">
        <ArrowDownToLine size={10} />
        IN
      </Badge>
    );
  }
  return (
    <Badge className="bg-orange-100 text-orange-700 gap-1 text-xs">
      <ArrowUpFromLine size={10} />
      OUT
    </Badge>
  );
}

// ─── Edit Check-In Dialog ─────────────────────────────────────────────────────

function EditCheckInDialog({
  movement,
  onClose,
  onSaved,
}: {
  movement: Movement | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<EditCheckInValues>({
    resolver: zodResolver(editCheckInSchema),
    defaultValues: { notes: "" },
  });

  async function onSubmit(values: EditCheckInValues) {
    if (!movement) return;
    setSaving(true);
    try {
      await coldtivateService.updateCheckIn(movement.id, { notes: values.notes });
      toast.success("Check-in updated");
      onSaved();
      onClose();
      reset();
    } catch {
      toast.error("Failed to update check-in");
    } finally {
      setSaving(false);
    }
  }

  if (!movement) return null;

  return (
    <Dialog open={!!movement} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Check-In</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-gray-500 -mt-2">
          {movement.farmer.user.firstName} {movement.farmer.user.lastName} · {movement.coolingUnit.name}
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          <div className="space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" placeholder="Add a note..." {...register("notes")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── CSV Helper ────────────────────────────────────────────────────────────────

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

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [coolingUnitFilter, setCoolingUnitFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "IN" | "OUT">("all");
  const [editMovement, setEditMovement] = useState<Movement | null>(null);
  const [sendingSms, setSendingSms] = useState<number | null>(null);

  const { data: coolingUnits } = useCoolingUnits();

  const queryParams = {
    page,
    pageSize: PAGE_SIZE,
    ...(dateFrom ? { from: dateFrom } : {}),
    ...(dateTo ? { to: dateTo } : {}),
    ...(coolingUnitFilter !== "all" ? { coolingUnitId: Number(coolingUnitFilter) } : {}),
  };

  const { data: movementsData, isLoading, mutate } = useMovements(queryParams);

  const rawData = movementsData as unknown;
  const isPaginated = rawData !== null && typeof rawData === "object" && "results" in (rawData as object);
  const allMovements: Movement[] = isPaginated
    ? (rawData as { results: Movement[] }).results
    : Array.isArray(rawData) ? (rawData as Movement[]) : [];
  const totalCount: number = isPaginated ? (rawData as { count: number }).count : allMovements.length;

  const movements = typeFilter === "all" ? allMovements : allMovements.filter((m) => m.type === typeFilter);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  async function handleSendSms(movementId: number) {
    setSendingSms(movementId);
    try {
      await coldtivateService.sendSmsReport(movementId);
      toast.success("SMS report sent");
    } catch {
      toast.error("Failed to send SMS report");
    } finally {
      setSendingSms(null);
    }
  }

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
          <p className="text-sm text-gray-500">
            {totalCount > 0 ? `${totalCount} total movements` : "No movements recorded"}
          </p>
        </div>
        <Button variant="outline" className="gap-1.5 self-start sm:self-auto" onClick={handleExport} disabled={!movements.length}>
          <Download size={15} />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
            <Filter size={14} />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">From</label>
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">To</label>
              <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Cooling Unit</label>
              <Select value={coolingUnitFilter} onValueChange={(v) => { setCoolingUnitFilter(v ?? "all"); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="All units" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All units</SelectItem>
                  {coolingUnits?.map((cu) => (
                    <SelectItem key={cu.id} value={cu.id.toString()}>{cu.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Type</label>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter((v ?? "all") as "all" | "IN" | "OUT"); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
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
      <div className="rounded-xl border border-gray-200 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Farmer</TableHead>
              <TableHead>Crop</TableHead>
              <TableHead>Cooling Unit</TableHead>
              <TableHead className="text-right">Crates</TableHead>
              <TableHead className="text-right">Weight</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Code</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <SkeletonRows />}

            {!isLoading && movements.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <ArrowDownToLine size={32} />
                    <p className="text-sm font-medium">No movements found</p>
                    <p className="text-xs">Try adjusting the filters above</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && movements.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-sm tabular-nums">{formatDate(m.createdAt)}</TableCell>
                <TableCell className="text-sm">{m.farmer.user.firstName} {m.farmer.user.lastName}</TableCell>
                <TableCell className="text-sm">{m.crop.name}</TableCell>
                <TableCell className="text-sm">{m.coolingUnit.name}</TableCell>
                <TableCell className="text-sm text-right tabular-nums">{m.cratesCount}</TableCell>
                <TableCell className="text-sm text-right tabular-nums">{formatWeight(m.totalWeight)}</TableCell>
                <TableCell><MovementTypeBadge type={m.type} /></TableCell>
                <TableCell className="text-sm font-mono text-gray-400">{m.movementCode}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {m.type === "IN" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Edit check-in"
                        onClick={() => setEditMovement(m)}
                      >
                        <Edit size={13} />
                      </Button>
                    )}
                    {m.type === "OUT" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Send SMS report"
                        disabled={sendingSms === m.id}
                        onClick={() => handleSendSms(m.id)}
                      >
                        <MessageSquare size={13} />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || isLoading}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || isLoading}>Next</Button>
        </div>
      </div>

      <EditCheckInDialog
        movement={editMovement}
        onClose={() => setEditMovement(null)}
        onSaved={() => mutate()}
      />
    </div>
  );
}
