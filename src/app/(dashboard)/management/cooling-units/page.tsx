"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Thermometer, MapPin, X, LocateFixed } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useCoolingUnits } from "@/hooks/use-cooling-units";
import { useLocations } from "@/hooks/use-locations";
import { useMapboxLocation } from "@/hooks/use-mapbox-location";
import { coldtivateService } from "@/services/coldtivate-service";
import { coolingUnitSchema, locationSchema, CoolingUnitFormValues, LocationFormValues } from "@/constants/schemas";
import {
  CoolingUnit,
  ECoolingUnitType,
  ECoolingUnitMetric,
  EPricingType,
} from "@/types/global";
import { cn } from "@/lib/utils";

// ─── Form Dialog ───────────────────────────────────────────────────────────────

function CoolingUnitFormDialog({
  open,
  onClose,
  editUnit,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editUnit: CoolingUnit | null;
  onSaved: () => void;
}) {
  const { data: locations, mutate: mutateLocations } = useLocations();
  const [saving, setSaving] = useState(false);
  const [showNewLocation, setShowNewLocation] = useState(false);
  const [creatingLocation, setCreatingLocation] = useState(false);
  const { getLocation, loading: locating, error: locationError } = useMapboxLocation();

  async function handleUseMyLocation() {
    const result = await getLocation();
    if (!result) return;
    locationForm.setValue("latitude", result.latitude);
    locationForm.setValue("longitude", result.longitude);
    if (result.city) locationForm.setValue("city", result.city);
    if (result.state) locationForm.setValue("state", result.state);
    if (result.street) locationForm.setValue("street", result.street);
    if (result.zipCode) locationForm.setValue("zipCode", result.zipCode);
  }

  const locationForm = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: { name: "", latitude: 0, longitude: 0, state: "", city: "", street: "", zipCode: "" },
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CoolingUnitFormValues>({
    resolver: zodResolver(coolingUnitSchema),
    defaultValues: {
      name: "",
      locationId: 0,
      coolingUnitType: ECoolingUnitType.FARM_GATE_STORAGE_ROOM,
      capacityInMetricTons: 0,
      capacityInNumberCrates: 0,
      metric: ECoolingUnitMetric.CRATES,
      crops: [],
      pricingType: EPricingType.FIXED,
      pricePerUnit: 0,
      public: false,
    },
  });

  useEffect(() => {
    if (editUnit) {
      reset({
        name: editUnit.name,
        locationId: editUnit.location,
        coolingUnitType: editUnit.coolingUnitType,
        capacityInMetricTons: editUnit.capacityInMetricTons,
        capacityInNumberCrates: editUnit.capacityInNumberCrates,
        metric: editUnit.metric,
        crops: editUnit.crops.map((c) => c.id),
        pricingType: editUnit.commonPricingType?.pricingType ?? EPricingType.FIXED,
        pricePerUnit: editUnit.commonPricingType?.price ?? 0,
        public: editUnit.public,
      });
    } else {
      reset({
        name: "",
        locationId: 0,
        coolingUnitType: ECoolingUnitType.FARM_GATE_STORAGE_ROOM,
        capacityInMetricTons: 0,
        capacityInNumberCrates: 0,
        metric: ECoolingUnitMetric.CRATES,
        crops: [],
        pricingType: EPricingType.FIXED,
        pricePerUnit: 0,
        public: false,
      });
    }
  }, [editUnit]);

  async function onSubmit(values: CoolingUnitFormValues) {
    setSaving(true);
    try {
      if (editUnit) {
        await coldtivateService.updateCoolingUnit(editUnit.id, values);
        toast.success("Cooling unit updated successfully");
      } else {
        await coldtivateService.createCoolingUnit(values);
        toast.success("Cooling unit created successfully");
      }
      onSaved();
      onClose();
      reset();
    } catch {
      toast.error(editUnit ? "Failed to update cooling unit" : "Failed to create cooling unit");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateLocation(
    locValues: LocationFormValues,
    setLocationId: (id: number) => void
  ) {
    setCreatingLocation(true);
    try {
      const created = await coldtivateService.createLocation(locValues);
      await mutateLocations();
      setLocationId(created.id);
      setShowNewLocation(false);
      locationForm.reset();
      toast.success(`Location "${created.name}" created`);
    } catch {
      toast.error("Failed to create location");
    } finally {
      setCreatingLocation(false);
    }
  }

  function handleClose() {
    reset();
    setShowNewLocation(false);
    locationForm.reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editUnit ? "Edit Cooling Unit" : "Add Cooling Unit"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Name */}
          <div>
            <label className="text-sm font-medium mb-1 block">Name</label>
            <Input {...register("name")} placeholder="e.g. Cold Store A" />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="text-sm font-medium mb-1 block">Type</label>
            <Controller
              control={control}
              name="coolingUnitType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ECoolingUnitType.FARM_GATE_STORAGE_ROOM}>Farm-gate Storage Room</SelectItem>
                    <SelectItem value={ECoolingUnitType.MARKET_STORAGE_ROOM}>Market Storage Room</SelectItem>
                    <SelectItem value={ECoolingUnitType.MOVABLE_UNIT}>Movable Unit</SelectItem>
                    <SelectItem value={ECoolingUnitType.OTHER}>Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.coolingUnitType && (
              <p className="text-xs text-red-500 mt-1">{errors.coolingUnitType.message}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">Location</label>
              {!showNewLocation && (
                <button
                  type="button"
                  onClick={() => setShowNewLocation(true)}
                  className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                >
                  <Plus size={12} />
                  New location
                </button>
              )}
            </div>

            {!showNewLocation ? (
              <>
                <Controller
                  control={control}
                  name="locationId"
                  render={({ field }) => (
                    <Select
                      value={field.value ? field.value.toString() : ""}
                      onValueChange={(v) => { if (v) field.onChange(Number(v)); }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={locations?.length ? "Select location" : "No locations yet — create one"} />
                      </SelectTrigger>
                      <SelectContent>
                        {locations?.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id.toString()}>
                            {loc.name}{loc.city ? ` · ${loc.city}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.locationId && (
                  <p className="text-xs text-red-500 mt-1">{errors.locationId.message}</p>
                )}
              </>
            ) : (
              <Controller
                control={control}
                name="locationId"
                render={({ field }) => (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-green-700 flex items-center gap-1.5">
                        <MapPin size={12} />
                        Create new location
                      </p>
                      <button
                        type="button"
                        onClick={() => { setShowNewLocation(false); locationForm.reset(); }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <Input
                        placeholder="Location name *"
                        {...locationForm.register("name")}
                        className="bg-white text-sm"
                      />
                      {locationForm.formState.errors.name && (
                        <p className="text-xs text-red-500">{locationForm.formState.errors.name.message}</p>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="City"
                          {...locationForm.register("city")}
                          className="bg-white text-sm"
                        />
                        <Input
                          placeholder="State"
                          {...locationForm.register("state")}
                          className="bg-white text-sm"
                        />
                      </div>
                      <Input
                        placeholder="Street address"
                        {...locationForm.register("street")}
                        className="bg-white text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleUseMyLocation}
                        disabled={locating}
                        className="flex items-center gap-1.5 text-xs text-green-700 hover:text-green-800 font-medium disabled:opacity-50"
                      >
                        <LocateFixed size={12} />
                        {locating ? "Detecting location..." : "Use my current location"}
                      </button>
                      {locationError && (
                        <p className="text-xs text-red-500">{locationError}</p>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Input
                            type="number"
                            step="any"
                            placeholder="Latitude *"
                            {...locationForm.register("latitude", { valueAsNumber: true })}
                            className="bg-white text-sm"
                          />
                          {locationForm.formState.errors.latitude && (
                            <p className="text-xs text-red-500">{locationForm.formState.errors.latitude.message}</p>
                          )}
                        </div>
                        <div>
                          <Input
                            type="number"
                            step="any"
                            placeholder="Longitude *"
                            {...locationForm.register("longitude", { valueAsNumber: true })}
                            className="bg-white text-sm"
                          />
                          {locationForm.formState.errors.longitude && (
                            <p className="text-xs text-red-500">{locationForm.formState.errors.longitude.message}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700 text-xs"
                      disabled={creatingLocation}
                      onClick={locationForm.handleSubmit((vals) =>
                        handleCreateLocation(vals, field.onChange)
                      )}
                    >
                      {creatingLocation ? "Creating..." : "Create & select this location"}
                    </Button>
                  </div>
                )}
              />
            )}
          </div>

          {/* Metric */}
          <div>
            <label className="text-sm font-medium mb-1 block">Metric</label>
            <Controller
              control={control}
              name="metric"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ECoolingUnitMetric.CRATES}>Crates</SelectItem>
                    <SelectItem value={ECoolingUnitMetric.KILOGRAMS}>Kilograms</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.metric && (
              <p className="text-xs text-red-500 mt-1">{errors.metric.message}</p>
            )}
          </div>

          {/* Capacities */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Capacity (Metric Tons)</label>
              <Input
                type="number"
                step="0.01"
                {...register("capacityInMetricTons", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.capacityInMetricTons && (
                <p className="text-xs text-red-500 mt-1">{errors.capacityInMetricTons.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Capacity (Crates)</label>
              <Input
                type="number"
                step="1"
                {...register("capacityInNumberCrates", { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.capacityInNumberCrates && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.capacityInNumberCrates.message}
                </p>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Pricing Type</label>
              <Controller
                control={control}
                name="pricingType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pricing type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EPricingType.FIXED}>Fixed</SelectItem>
                      <SelectItem value={EPricingType.DAILY}>Daily</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.pricingType && (
                <p className="text-xs text-red-500 mt-1">{errors.pricingType.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Price per Unit</label>
              <Input
                type="number"
                step="0.01"
                {...register("pricePerUnit", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.pricePerUnit && (
                <p className="text-xs text-red-500 mt-1">{errors.pricePerUnit.message}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={saving}>
              {saving ? "Saving..." : editUnit ? "Save Changes" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Table Skeleton ────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0 divide-y">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-5 w-16 rounded-full ml-auto" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ManagementCoolingUnitsPage() {
  const { data: coolingUnits, isLoading, mutate } = useCoolingUnits();
  const [formOpen, setFormOpen] = useState(false);
  const [editUnit, setEditUnit] = useState<CoolingUnit | null>(null);
  const [deleteUnit, setDeleteUnit] = useState<CoolingUnit | null>(null);
  const [deleting, setDeleting] = useState(false);

  function occupancyPercent(unit: CoolingUnit): number {
    const capacity =
      unit.metric === ECoolingUnitMetric.CRATES
        ? unit.capacityInNumberCrates
        : unit.capacityInMetricTons;
    if (!capacity) return 0;
    return Math.min(100, Math.round((unit.occupancy / capacity) * 100));
  }

  function occupancyColor(pct: number): string {
    if (pct < 60) return "bg-green-100 text-green-700";
    if (pct < 85) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  }

  async function handleDelete() {
    if (!deleteUnit) return;
    setDeleting(true);
    try {
      await coldtivateService.deleteCoolingUnit(deleteUnit.id);
      await mutate();
      toast.success(`${deleteUnit.name} deleted`);
      setDeleteUnit(null);
    } catch {
      toast.error("Failed to delete cooling unit");
    } finally {
      setDeleting(false);
    }
  }

  function openAdd() {
    setEditUnit(null);
    setFormOpen(true);
  }

  function openEdit(unit: CoolingUnit) {
    setEditUnit(unit);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Thermometer size={20} className="text-green-600" />
            Cooling Units
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your cold storage facilities
          </p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 gap-1.5 self-start" onClick={openAdd}>
          <Plus size={16} />
          Add Cooling Unit
        </Button>
      </div>

      {isLoading && <TableSkeleton />}

      {!isLoading && (!coolingUnits || coolingUnits.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Thermometer className="text-muted-foreground mb-3" size={44} />
            <h3 className="font-semibold mb-1">No cooling units yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first cooling unit to start managing storage
            </p>
            <Button className="bg-green-600 hover:bg-green-700" onClick={openAdd}>
              <Plus size={14} className="mr-2" />
              Add Cooling Unit
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && coolingUnits && coolingUnits.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {coolingUnits.length} unit{coolingUnits.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Capacity</TableHead>
                    <TableHead className="text-center">Occupancy</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coolingUnits.map((unit) => {
                    const pct = occupancyPercent(unit);
                    return (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium text-sm">{unit.name}</TableCell>
                        <TableCell className="text-sm capitalize">
                          {unit.coolingUnitType.toLowerCase().replace("_", " ")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          #{unit.location}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {unit.metric === ECoolingUnitMetric.CRATES
                            ? `${unit.capacityInNumberCrates} crates`
                            : `${unit.capacityInMetricTons} t`}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={cn("border-0 text-xs", occupancyColor(pct))}
                          >
                            {pct}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {unit.sensorError ? (
                            <Badge className="bg-red-100 text-red-700 border-0 text-xs">
                              Sensor Error
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(unit)}
                            >
                              <Edit size={14} />
                            </Button>
                            {unit.canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => setDeleteUnit(unit)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form dialog */}
      <CoolingUnitFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editUnit={editUnit}
        onSaved={() => mutate()}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteUnit} onOpenChange={(v) => !v && setDeleteUnit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cooling Unit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteUnit?.name}</strong>? This action
              cannot be undone and all associated data will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
