"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { mutate } from "swr";
import { Plus, Edit, Trash2, MapPin } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

import { useLocations } from "@/hooks/use-locations";
import { coldtivateService } from "@/services/coldtivate-service";
import { locationSchema, LocationFormValues } from "@/constants/schemas";
import { Location } from "@/types/global";

// ─── WKT helper ────────────────────────────────────────────────────────────────

function parsePoint(point: string): { lat: number; lng: number } | null {
  const match = point.match(/POINT\(([^ ]+)\s+([^ )]+)\)/i);
  if (!match) return null;
  return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
}

// ─── Table Skeleton ────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-28" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16 ml-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Location Form Dialog ──────────────────────────────────────────────────────

function LocationFormDialog({
  open,
  onClose,
  editLocation,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editLocation: Location | null;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const editCoords = editLocation ? parsePoint(editLocation.point) : null;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: editLocation
      ? {
          name: editLocation.name,
          latitude: editCoords?.lat ?? 0,
          longitude: editCoords?.lng ?? 0,
          state: editLocation.state ?? "",
          city: editLocation.city ?? "",
          street: editLocation.street ?? "",
          streetNumber: editLocation.streetNumber,
          zipCode: editLocation.zipCode ?? "",
        }
      : { name: "", latitude: 0, longitude: 0, state: "", city: "", street: "", zipCode: "" },
  });

  async function onSubmit(values: LocationFormValues) {
    setSaving(true);
    try {
      if (editLocation) {
        await coldtivateService.updateLocation(editLocation.id, values);
        toast.success("Location updated successfully");
      } else {
        await coldtivateService.createLocation(values);
        toast.success("Location created successfully");
      }
      onSaved();
      onClose();
      reset();
    } catch {
      toast.error(editLocation ? "Failed to update location" : "Failed to create location");
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    reset();
    onClose();
  }


  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editLocation ? "Edit Location" : "Add Location"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" placeholder="e.g. Kano Warehouse" {...register("name")} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Coordinates</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="e.g. 12.0022"
                  {...register("latitude", { valueAsNumber: true })}
                />
                {errors.latitude && (
                  <p className="text-xs text-red-500">{errors.latitude.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="e.g. 8.5920"
                  {...register("longitude", { valueAsNumber: true })}
                />
                {errors.longitude && (
                  <p className="text-xs text-red-500">{errors.longitude.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="e.g. Kano" {...register("city")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="state">State</Label>
              <Input id="state" placeholder="e.g. Kano State" {...register("state")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="street">Street</Label>
              <Input id="street" placeholder="e.g. Market Road" {...register("street")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="streetNumber">Street No.</Label>
              <Input
                id="streetNumber"
                type="number"
                placeholder="e.g. 12"
                {...register("streetNumber", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="zipCode">Zip / Postal Code</Label>
            <Input id="zipCode" placeholder="e.g. 700001" {...register("zipCode")} />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={saving}
            >
              {saving ? "Saving..." : editLocation ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function LocationsPage() {
  const { data: locations, isLoading, mutate: revalidate } = useLocations();
  const [formOpen, setFormOpen] = useState(false);
  const [editLocation, setEditLocation] = useState<Location | null>(null);
  const [deleteLocation, setDeleteLocation] = useState<Location | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteLocation) return;
    setDeleting(true);
    try {
      await coldtivateService.deleteLocation(deleteLocation.id);
      await revalidate();
      mutate("locations");
      toast.success(`"${deleteLocation.name}" deleted`);
      setDeleteLocation(null);
    } catch {
      toast.error("Failed to delete location");
    } finally {
      setDeleting(false);
    }
  }

  function openAdd() {
    setEditLocation(null);
    setFormOpen(true);
  }

  function openEdit(loc: Location) {
    setEditLocation(loc);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MapPin size={20} className="text-green-600" />
            Locations
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage storage facility locations
          </p>
        </div>
        <Button
          className="bg-green-600 hover:bg-green-700 gap-1.5 self-start"
          onClick={openAdd}
        >
          <Plus size={16} />
          Add Location
        </Button>
      </div>

      {isLoading && <TableSkeleton />}

      {!isLoading && (!locations || locations.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className="text-muted-foreground mb-3" size={44} />
            <h3 className="font-semibold mb-1">No locations yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first location to start organizing cooling units
            </p>
            <Button className="bg-green-600 hover:bg-green-700" onClick={openAdd}>
              <Plus size={14} className="mr-2" />
              Add Location
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && locations && locations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {locations.length} location{locations.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Street</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((loc) => (
                    <TableRow key={loc.id}>
                      <TableCell className="font-medium text-sm">{loc.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {loc.city || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {loc.state || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {loc.street
                          ? `${loc.street}${loc.streetNumber ? ` ${loc.streetNumber}` : ""}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(loc)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteLocation(loc)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <LocationFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editLocation={editLocation}
        onSaved={() => revalidate()}
      />

      <AlertDialog open={!!deleteLocation} onOpenChange={(v) => !v && setDeleteLocation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteLocation?.name}</strong>? This action
              cannot be undone.
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
