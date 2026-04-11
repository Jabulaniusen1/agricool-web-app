"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Check, Plus, Trash2, Loader2 } from "lucide-react";
import { mutate } from "swr";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { useFarmers } from "@/hooks/use-farmers";
import { useCoolingUnits, useCoolingUnitCrops } from "@/hooks/use-cooling-units";
import { useDashboardStore } from "@/stores/dashboard";
import { coldtivateService } from "@/services/coldtivate-service";
import { Farmer, CoolingUnitCrop, CoolingUnit, EPricingType } from "@/types/global";
import { ROUTES } from "@/constants/routes";

const STEPS = ["Farmer", "Crop", "Crates", "Pricing", "Confirm"];

type CrateEntry = {
  weight: number;
  tag?: string;
  grade?: string;
  harvestDate?: string;
  plannedDays?: number;
};

export default function CheckInPage() {
  const router = useRouter();
  const { selectedCoolingUnitId } = useDashboardStore();

  const [step, setStep] = useState(0);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<CoolingUnitCrop | null>(null);
  const [selectedCoolingUnit, setSelectedCoolingUnit] = useState<CoolingUnit | null>(null);
  const [crates, setCrates] = useState<CrateEntry[]>([{ weight: 0 }]);
  const [pricingType, setPricingType] = useState<string>(EPricingType.FIXED as string);
  const [pricePerUnit, setPricePerUnit] = useState<number>(0);
  const [farmerSearch, setFarmerSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: farmers } = useFarmers();
  const { data: crops } = useCoolingUnitCrops();
  const { data: coolingUnits } = useCoolingUnits();

  const filteredFarmers = farmers?.filter((f) => {
    const name = `${f.user.firstName} ${f.user.lastName}`.toLowerCase();
    const code = f.code?.toLowerCase() ?? "";
    const phone = f.user.phone ?? "";
    const q = farmerSearch.toLowerCase();
    return name.includes(q) || code.includes(q) || phone.includes(q);
  });

  const addCrate = () => setCrates([...crates, { weight: 0 }]);
  const removeCrate = (i: number) => setCrates(crates.filter((_, idx) => idx !== i));
  const updateCrate = (i: number, field: keyof CrateEntry, value: string | number) => {
    setCrates(crates.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  };

  const canProceed = () => {
    if (step === 0) return !!selectedFarmer;
    if (step === 1) return !!selectedCrop;
    if (step === 2) return crates.length > 0 && crates.every((c) => c.weight > 0);
    if (step === 3) return true;
    return true;
  };

  const handleSubmit = async () => {
    if (!selectedFarmer || !selectedCrop) return;

    const coolingUnitId = selectedCoolingUnit?.id ?? selectedCoolingUnitId;
    if (!coolingUnitId) {
      toast.error("Please select a cooling unit");
      return;
    }

    setIsSubmitting(true);
    try {
      await coldtivateService.checkIn({
        farmerId: selectedFarmer.id,
        coolingUnitId,
        cropId: selectedCrop.id,
        crates: crates.map((c) => ({
          weight: c.weight,
          tag: c.tag,
          grade: c.grade,
          harvestDate: c.harvestDate,
          plannedDays: c.plannedDays,
        })),
        pricingType,
        pricePerUnit,
      });
      toast.success("Check-in successful!");
      mutate(`produces/${coolingUnitId}`);
      router.push(ROUTES.DASHBOARD);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? "Check-in failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                i < step
                  ? "bg-green-600 text-white"
                  : i === step
                  ? "bg-green-100 text-green-700 border-2 border-green-600"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {i < step ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-xs hidden sm:inline ${i === step ? "font-medium" : "text-muted-foreground"}`}>
              {s}
            </span>
            {i < STEPS.length - 1 && <div className="flex-1 h-0.5 bg-gray-200" />}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step 0: Farmer */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label>Search Farmer</Label>
                <Input
                  placeholder="Search by name, code, or phone..."
                  value={farmerSearch}
                  onChange={(e) => setFarmerSearch(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredFarmers?.map((farmer) => (
                  <button
                    key={farmer.id}
                    onClick={() => setSelectedFarmer(farmer)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left hover:bg-accent transition-colors ${
                      selectedFarmer?.id === farmer.id ? "border-green-500 bg-green-50" : ""
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                      {farmer.user.firstName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {farmer.user.firstName} {farmer.user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {farmer.code} · {farmer.user.phone}
                      </p>
                    </div>
                    {selectedFarmer?.id === farmer.id && (
                      <Check size={16} className="ml-auto text-green-600" />
                    )}
                  </button>
                ))}
                {filteredFarmers?.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">No farmers found</p>
                )}
              </div>
              {/* Cooling unit selector */}
              <div>
                <Label>Cooling Unit</Label>
                <Select
                  value={selectedCoolingUnit?.id.toString() ?? selectedCoolingUnitId?.toString() ?? ""}
                  onValueChange={(v) => setSelectedCoolingUnit(coolingUnits?.find((cu) => cu.id === Number(v)) ?? null)}
                >
                  <SelectTrigger className="mt-1">
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
              </div>
            </div>
          )}

          {/* Step 1: Crop */}
          {step === 1 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {crops?.map((crop) => (
                <button
                  key={crop.id}
                  onClick={() => setSelectedCrop(crop)}
                  className={`p-4 rounded-lg border text-center hover:bg-accent transition-colors ${
                    selectedCrop?.id === crop.id ? "border-green-500 bg-green-50" : ""
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2 overflow-hidden">
                    {crop.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={crop.image} alt={crop.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">🌿</span>
                    )}
                  </div>
                  <p className="text-sm font-medium">{crop.name}</p>
                  {selectedCrop?.id === crop.id && (
                    <Check size={14} className="mx-auto mt-1 text-green-600" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Crates */}
          {step === 2 && (
            <div className="space-y-4">
              {crates.map((crate, i) => (
                <div key={i} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Crate {i + 1}</Badge>
                    {crates.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeCrate(i)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Weight (kg) *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={crate.weight || ""}
                        onChange={(e) => updateCrate(i, "weight", Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Tag</Label>
                      <Input
                        placeholder="e.g. A1"
                        value={crate.tag ?? ""}
                        onChange={(e) => updateCrate(i, "tag", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Grade</Label>
                      <Input
                        placeholder="A, B, C..."
                        value={crate.grade ?? ""}
                        onChange={(e) => updateCrate(i, "grade", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Planned Days</Label>
                      <Input
                        type="number"
                        min="1"
                        value={crate.plannedDays ?? ""}
                        onChange={(e) => updateCrate(i, "plannedDays", Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Harvest Date</Label>
                      <Input
                        type="date"
                        value={crate.harvestDate ?? ""}
                        onChange={(e) => updateCrate(i, "harvestDate", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full gap-2" onClick={addCrate}>
                <Plus size={14} />
                Add Another Crate
              </Button>
            </div>
          )}

          {/* Step 3: Pricing */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Pricing Type</Label>
                <Select value={pricingType} onValueChange={(v) => v && setPricingType(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EPricingType.FIXED}>Fixed Rate</SelectItem>
                    <SelectItem value={EPricingType.DAILY}>Daily Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  Price per {pricingType === EPricingType.DAILY ? "Day" : "Unit"}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricePerUnit || ""}
                  onChange={(e) => setPricePerUnit(Number(e.target.value))}
                  className="mt-1"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Leave at 0 to use the cooling unit&apos;s default pricing.
              </p>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Farmer</span>
                  <span className="font-medium">
                    {selectedFarmer?.user.firstName} {selectedFarmer?.user.lastName}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Crop</span>
                  <span className="font-medium">{selectedCrop?.name}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cooling Unit</span>
                  <span className="font-medium">
                    {selectedCoolingUnit?.name ?? coolingUnits?.find((cu) => cu.id === selectedCoolingUnitId)?.name}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Crates</span>
                  <span className="font-medium">{crates.length}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Weight</span>
                  <span className="font-medium">
                    {crates.reduce((s, c) => s + c.weight, 0).toFixed(1)} kg
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pricing</span>
                  <span className="font-medium">
                    {pricingType} · {pricePerUnit > 0 ? `${pricePerUnit}/unit` : "Default"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => (step === 0 ? router.back() : setStep(step - 1))}
        >
          <ChevronLeft size={16} className="mr-1" />
          {step === 0 ? "Cancel" : "Back"}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
          >
            Next
            <ChevronRight size={16} className="ml-1" />
          </Button>
        ) : (
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 size={16} className="mr-2 animate-spin" />}
            Confirm Check-In
          </Button>
        )}
      </div>
    </div>
  );
}
