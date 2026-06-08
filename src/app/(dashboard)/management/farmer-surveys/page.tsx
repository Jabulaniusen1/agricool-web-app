"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ClipboardList, Edit, Plus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { coldtivateService } from "@/services/coldtivate-service";
import { useApiCall } from "@/hooks/use-api";
import { useCrops } from "@/hooks/use-cooling-units";
import { useFarmers } from "@/hooks/use-farmers";
import { Farmer, FarmerSurvey, FarmerSurveyCommodity } from "@/types/global";
import { FarmerSurveyCommodityParams } from "@/types/api.params";

const UNIT_OPTIONS = ["KILOGRAMS", "CRATES", "BAGS", "SACKS", "BASKETS"];
const CURRENCY_OPTIONS = ["NGN", "INR", "USD", "PHP"];

const surveySchema = z.object({
  farmerId: z.string().min(1, "Farmer is required"),
  userType: z.enum(["FARMER", "TRADER"]),
  experience: z.enum(["yes", "no"]),
  experienceDuration: z.string().min(1, "Experience duration is required"),
  cropId: z.string().min(1, "Crop is required"),
  averagePrice: z.string().min(1, "Average price is required"),
  unit: z.string().min(1, "Unit is required"),
  kgInUnit: z.string().min(1, "Unit weight is required"),
  quantityTotal: z.string().min(1, "Total quantity is required"),
  quantitySelfConsumed: z.string().min(1, "Self-consumed quantity is required"),
  quantitySold: z.string().min(1, "Sold quantity is required"),
  quantityBelowMarketPrice: z.string().min(1, "Loss quantity is required"),
  averageSeasonInMonths: z.string().optional(),
  currency: z.string().min(1, "Currency is required"),
  reasonForLoss: z.string().optional(),
});

type SurveyFormValues = z.infer<typeof surveySchema>;

function farmerName(farmer: Farmer | undefined): string {
  if (!farmer) return "Unknown farmer";
  return `${farmer.user.firstName} ${farmer.user.lastName}`;
}

function numberText(value: number | null | undefined, fallback = "0"): string {
  return value === null || value === undefined ? fallback : String(value);
}

function parseNumber(value: string | undefined, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function commodityToPayload(commodity: FarmerSurveyCommodity): FarmerSurveyCommodityParams {
  return {
    cropId: commodity.cropId,
    averagePrice: Number(commodity.averagePrice) || 0,
    unit: commodity.unit || "KILOGRAMS",
    quantityTotal: Number(commodity.quantityTotal) || 0,
    quantitySelfConsumed: Number(commodity.quantitySelfConsumed) || 0,
    quantitySold: Number(commodity.quantitySold) || 0,
    quantityBelowMarketPrice: Number(commodity.quantityBelowMarketPrice) || 0,
    averageSeasonInMonths: commodity.averageSeasonInMonths ?? null,
    currency: commodity.currency || "NGN",
    kgInUnit: Number(commodity.kgInUnit) || 1,
    reasonForLoss: commodity.reasonForLoss || "",
  };
}

function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(value) || 0);
}

function SurveyDialog({
  open,
  onClose,
  farmers,
  crops,
  selectedFarmerId,
  surveyGroup,
  editCommodity,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  farmers: Farmer[];
  crops: { id: number; name: string }[];
  selectedFarmerId: number | null;
  surveyGroup: FarmerSurvey | null;
  editCommodity: FarmerSurveyCommodity | null;
  onSaved: (farmerId: number) => void;
}) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, control, reset, formState: { errors } } =
    useForm<SurveyFormValues>({
      resolver: zodResolver(surveySchema),
      defaultValues: {
        farmerId: selectedFarmerId ? String(selectedFarmerId) : "",
        userType: "FARMER",
        experience: "no",
        experienceDuration: "1",
        cropId: "",
        averagePrice: "0",
        unit: "KILOGRAMS",
        kgInUnit: "1",
        quantityTotal: "0",
        quantitySelfConsumed: "0",
        quantitySold: "0",
        quantityBelowMarketPrice: "0",
        averageSeasonInMonths: "",
        currency: "NGN",
        reasonForLoss: "",
      },
    });

  useEffect(() => {
    if (!open) return;
    reset({
      farmerId: selectedFarmerId ? String(selectedFarmerId) : "",
      userType: (surveyGroup?.userType === "TRADER" ? "TRADER" : "FARMER"),
      experience: surveyGroup?.experience ? "yes" : "no",
      experienceDuration: numberText(surveyGroup?.experienceDuration, "1"),
      cropId: editCommodity ? String(editCommodity.cropId) : "",
      averagePrice: numberText(editCommodity?.averagePrice),
      unit: editCommodity?.unit ?? "KILOGRAMS",
      kgInUnit: numberText(editCommodity?.kgInUnit, "1"),
      quantityTotal: numberText(editCommodity?.quantityTotal),
      quantitySelfConsumed: numberText(editCommodity?.quantitySelfConsumed),
      quantitySold: numberText(editCommodity?.quantitySold),
      quantityBelowMarketPrice: numberText(editCommodity?.quantityBelowMarketPrice),
      averageSeasonInMonths: numberText(editCommodity?.averageSeasonInMonths, ""),
      currency: editCommodity?.currency ?? "NGN",
      reasonForLoss: editCommodity?.reasonForLoss ?? "",
    });
  }, [editCommodity, open, reset, selectedFarmerId, surveyGroup]);

  async function onSubmit(values: SurveyFormValues) {
    const farmerId = Number(values.farmerId);
    const cropId = Number(values.cropId);
    if (!farmerId || !cropId) return;

    setSaving(true);
    try {
      const nextCommodity: FarmerSurveyCommodityParams = {
        cropId,
        averagePrice: parseNumber(values.averagePrice),
        unit: values.unit,
        kgInUnit: parseNumber(values.kgInUnit, 1),
        quantityTotal: parseNumber(values.quantityTotal),
        quantitySelfConsumed: parseNumber(values.quantitySelfConsumed),
        quantitySold: parseNumber(values.quantitySold),
        quantityBelowMarketPrice: parseNumber(values.quantityBelowMarketPrice),
        averageSeasonInMonths: values.averageSeasonInMonths
          ? parseNumber(values.averageSeasonInMonths)
          : null,
        currency: values.currency,
        reasonForLoss: values.reasonForLoss ?? "",
      };
      const existingCommodities = surveyGroup?.farmer === farmerId ? surveyGroup.co : [];
      const commodities = [
        ...existingCommodities
          .filter((commodity) => commodity.cropId !== cropId)
          .map(commodityToPayload),
        nextCommodity,
      ];

      await coldtivateService.updateFarmerSurveys(farmerId, {
        farmer: farmerId,
        userType: values.userType,
        experience: values.experience,
        experienceDuration: parseNumber(values.experienceDuration, 1),
        commodities,
      });

      toast.success(editCommodity ? "Survey commodity updated" : "Survey commodity saved");
      onSaved(farmerId);
      onClose();
    } catch (error) {
      toast.error((error as { message?: string })?.message ?? "Failed to save survey");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editCommodity ? "Edit Survey Commodity" : "New Farmer Survey"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Farmer *</Label>
              <Controller
                control={control}
                name="farmerId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!!selectedFarmerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select farmer" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {farmers.map((farmer) => (
                        <SelectItem key={farmer.id} value={String(farmer.id)}>
                          {farmerName(farmer)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.farmerId && <p className="text-xs text-red-500">{errors.farmerId.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>User Type</Label>
              <Controller
                control={control}
                name="userType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FARMER">Farmer</SelectItem>
                      <SelectItem value="TRADER">Trader</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1">
              <Label>Cold Storage Experience</Label>
              <Controller
                control={control}
                name="experience"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">New user</SelectItem>
                      <SelectItem value="yes">Experienced user</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="experienceDuration">Experience Duration (months)</Label>
              <Input id="experienceDuration" type="number" min="0" step="1" {...register("experienceDuration")} />
              {errors.experienceDuration && <p className="text-xs text-red-500">{errors.experienceDuration.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Crop *</Label>
              <Controller
                control={control}
                name="cropId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select crop" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {crops.map((crop) => (
                        <SelectItem key={crop.id} value={String(crop.id)}>
                          {crop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.cropId && <p className="text-xs text-red-500">{errors.cropId.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Unit</Label>
              <Controller
                control={control}
                name="unit"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit.toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="quantityTotal">Total Quantity</Label>
              <Input id="quantityTotal" type="number" min="0" step="0.01" {...register("quantityTotal")} />
              {errors.quantityTotal && <p className="text-xs text-red-500">{errors.quantityTotal.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="quantitySold">Quantity Sold</Label>
              <Input id="quantitySold" type="number" min="0" step="0.01" {...register("quantitySold")} />
              {errors.quantitySold && <p className="text-xs text-red-500">{errors.quantitySold.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="quantitySelfConsumed">Self-Consumed Quantity</Label>
              <Input id="quantitySelfConsumed" type="number" min="0" step="0.01" {...register("quantitySelfConsumed")} />
              {errors.quantitySelfConsumed && <p className="text-xs text-red-500">{errors.quantitySelfConsumed.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="quantityBelowMarketPrice">Lost / Below Market Quantity</Label>
              <Input id="quantityBelowMarketPrice" type="number" min="0" step="0.01" {...register("quantityBelowMarketPrice")} />
              {errors.quantityBelowMarketPrice && <p className="text-xs text-red-500">{errors.quantityBelowMarketPrice.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="averagePrice">Average Price</Label>
              <Input id="averagePrice" type="number" min="0" step="0.01" {...register("averagePrice")} />
              {errors.averagePrice && <p className="text-xs text-red-500">{errors.averagePrice.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Currency</Label>
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map((currency) => (
                        <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="kgInUnit">Kg In Unit</Label>
              <Input id="kgInUnit" type="number" min="0" step="0.01" {...register("kgInUnit")} />
              {errors.kgInUnit && <p className="text-xs text-red-500">{errors.kgInUnit.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="averageSeasonInMonths">Average Season (months)</Label>
              <Input id="averageSeasonInMonths" type="number" min="0" step="1" {...register("averageSeasonInMonths")} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="reasonForLoss">Reason For Loss</Label>
            <Textarea id="reasonForLoss" placeholder="e.g. Lack of cold storage, pests, transport damage" {...register("reasonForLoss")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={saving}>
              {saving ? "Saving..." : "Save Survey"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function FarmerSurveysPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editCommodity, setEditCommodity] = useState<FarmerSurveyCommodity | null>(null);
  const [selectedFarmerId, setSelectedFarmerId] = useState<number | null>(null);
  const { data: farmers = [] } = useFarmers();
  const { data: crops = [] } = useCrops();

  const activeFarmerId = selectedFarmerId ?? farmers[0]?.id ?? null;

  const {
    data: surveyGroups,
    isLoading,
    error,
    mutate,
  } = useApiCall<FarmerSurvey[]>(
    activeFarmerId ? `farmer-surveys-${activeFarmerId}` : null,
    () => coldtivateService.getFarmerSurveys(activeFarmerId!)
  );

  const surveyGroup = surveyGroups?.[0] ?? null;
  const commodities = surveyGroup?.co ?? [];
  const cropNameById = useMemo(
    () => new Map(crops.map((crop) => [crop.id, crop.name])),
    [crops]
  );

  function openAdd() {
    setEditCommodity(null);
    setFormOpen(true);
  }

  function openEdit(commodity: FarmerSurveyCommodity) {
    setEditCommodity(commodity);
    setFormOpen(true);
  }

  function handleSaved(farmerId: number) {
    setSelectedFarmerId(farmerId);
    mutate();
  }

  const selectedFarmer = farmers.find((farmer) => farmer.id === activeFarmerId);
  const errorMessage = (error as { message?: string } | undefined)?.message;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList size={20} className="text-green-600" />
            Farmer Surveys
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">Baseline survey records for registered farmers</p>
        </div>
        <Button
          className="bg-green-600 hover:bg-green-700 gap-1.5 self-start"
          onClick={openAdd}
          disabled={farmers.length === 0}
        >
          <Plus size={16} />
          New Survey
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="w-full sm:w-72">
          <Label className="text-xs text-gray-500">Farmer</Label>
          <Select
            value={activeFarmerId ? String(activeFarmerId) : ""}
            onValueChange={(value) => setSelectedFarmerId(value ? Number(value) : null)}
            disabled={farmers.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select farmer" />
            </SelectTrigger>
            <SelectContent className="max-h-56">
              {farmers.map((farmer) => (
                <SelectItem key={farmer.id} value={String(farmer.id)}>
                  {farmerName(farmer)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage ?? "Failed to load farmer surveys."}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {isLoading
              ? "Loading..."
              : `${commodities.length} survey commodit${commodities.length === 1 ? "y" : "ies"}`}
            {selectedFarmer ? ` for ${farmerName(selectedFarmer)}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {[1, 2, 3].map((index) => (
                <div key={index} className="flex items-center gap-4 px-5 py-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20 ml-auto" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : !activeFarmerId ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <ClipboardList className="text-gray-300 mb-3" size={42} />
              <h3 className="font-semibold mb-1">Select a farmer</h3>
              <p className="text-sm text-gray-500">Choose a farmer to view or record baseline survey data</p>
            </div>
          ) : commodities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <ClipboardList className="text-gray-300 mb-3" size={42} />
              <h3 className="font-semibold mb-1">No survey commodities yet</h3>
              <p className="text-sm text-gray-500 mb-4">Start recording baseline survey data for this farmer</p>
              <Button className="bg-green-600 hover:bg-green-700" onClick={openAdd}>
                <Plus size={14} className="mr-2" />New Survey
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crop</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Sold</TableHead>
                  <TableHead>Lost / Below Market</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commodities.map((commodity) => (
                  <TableRow key={`${commodity.cropId}-${commodity.id ?? commodity.cropId}`}>
                    <TableCell className="font-medium text-sm">
                      {cropNameById.get(commodity.cropId) ?? `Crop #${commodity.cropId}`}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatNumber(commodity.quantityTotal)} {commodity.unit}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatNumber(commodity.quantitySold)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatNumber(commodity.quantityBelowMarketPrice)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {commodity.currency} {formatNumber(commodity.averagePrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(commodity)}>
                        <Edit size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SurveyDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        farmers={farmers}
        crops={crops}
        selectedFarmerId={activeFarmerId}
        surveyGroup={surveyGroup}
        editCommodity={editCommodity}
        onSaved={handleSaved}
      />
    </div>
  );
}
