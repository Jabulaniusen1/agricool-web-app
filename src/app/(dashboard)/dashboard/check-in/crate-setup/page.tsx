"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ChevronRight, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCheckInStore, ProduceCrate, CheckInCrateItem } from "@/stores/check-in";
import {
  CoolingUnit,
  CoolingUnitCrop,
  EDateCropped,
  EPricingType,
  ECoolingUnitMetric,
} from "@/types/global";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

// ─── Harvest date options ─────────────────────────────────────────────────────

const HARVEST_OPTIONS: { value: EDateCropped; label: string }[] = [
  { value: EDateCropped.TODAY, label: "Today" },
  { value: EDateCropped.YESTERDAY, label: "Yesterday" },
  { value: EDateCropped.DAY_BEFORE, label: "Day before yesterday" },
  { value: EDateCropped.EVEN_BEFORE, label: "Before that" },
];

// ─── Pricing helpers ──────────────────────────────────────────────────────────

function calcPrice(
  crates: CrateState[],
  coolingUnit: CoolingUnit,
  plannedDays: number | undefined
): string {
  if (!coolingUnit.commonPricingType) return "0.00";
  const { pricingType, price } = coolingUnit.commonPricingType;
  const metric = coolingUnit.metric;

  return crates
    .reduce((acc, crate) => {
      const metricMul = metric === ECoolingUnitMetric.KILOGRAMS ? crate.weight : 1;
      if (pricingType === EPricingType.FIXED) {
        acc += metricMul * price;
      } else {
        const mul = plannedDays ?? 1;
        acc += metricMul * mul * price;
      }
      return acc;
    }, 0)
    .toFixed(2);
}

function formatCurrency(currency: string, amount: string | number): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${currency} ${amount}`;
  }
}

// ─── Local crate state ────────────────────────────────────────────────────────

type CrateState = {
  weight: number;
  tag: string;
  isSellable: boolean;
};

function makeCrates(count: number, defaultWeight: number): CrateState[] {
  return Array.from({ length: count }, () => ({
    weight: defaultWeight,
    tag: "",
    isSellable: false,
  }));
}

// ─── Individual crate IDs modal ───────────────────────────────────────────────

function CrateIdsModal({
  open,
  crates,
  onSave,
  onClose,
}: {
  open: boolean;
  crates: CrateState[];
  onSave: (updated: CrateState[]) => void;
  onClose: () => void;
}) {
  const [localCrates, setLocalCrates] = useState<CrateState[]>(crates);

  useEffect(() => {
    if (open) setLocalCrates(crates.map((c) => ({ ...c })));
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Individual Crate IDs</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {localCrates.map((crate, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-16 shrink-0">
                Crate {i + 1}
              </span>
              <Input
                className="flex-1 h-9 text-sm"
                placeholder="Tag / ID"
                value={crate.tag}
                onChange={(e) => {
                  const updated = [...localCrates];
                  updated[i] = { ...updated[i], tag: e.target.value };
                  setLocalCrates(updated);
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => {
              onSave(localCrates);
              onClose();
            }}
          >
            <Check size={14} className="mr-1" />
            Save
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CrateSetupPage() {
  const router = useRouter();

  const {
    coolingUnit,
    farmer,
    pendingCrop,
    editingProduce,
    crateWeightPricingResult,
    setCrateWeightPricingResult,
    setCrateWeightPricingInput,
    addProduce,
    removeProduce,
    setPendingCrop,
    setEditingProduce,
  } = useCheckInStore();

  // ── Determine context ───────────────────────────────────────────────────────
  const isEditing = !!editingProduce;
  const crop: CoolingUnitCrop | undefined =
    isEditing ? editingProduce!.crop : pendingCrop?.crop;
  const additionalInfo = isEditing
    ? editingProduce!.additionalInfo
    : (pendingCrop?.additionalInfo ?? "");

  const defaultWeight = coolingUnit?.crateWeight ?? 25;

  // ── Form state ──────────────────────────────────────────────────────────────
  const [numberOfCrates, setNumberOfCrates] = useState<number>(() => {
    if (isEditing && editingProduce) return editingProduce.crates.length;
    return 1;
  });

  const [crates, setCrates] = useState<CrateState[]>(() => {
    if (isEditing && editingProduce) {
      return editingProduce.crates.map((c) => ({
        weight: c.weight,
        tag: c.tag ?? "",
        isSellable: c.isSellable,
      }));
    }
    return makeCrates(1, defaultWeight);
  });

  const [plannedDays, setPlannedDays] = useState<string>(() => {
    if (isEditing && editingProduce?.crates[0]?.plannedDays != null) {
      return String(editingProduce.crates[0].plannedDays);
    }
    return "";
  });

  const [harvestDate, setHarvestDate] = useState<EDateCropped | undefined>(() => {
    if (isEditing) return editingProduce?.harvestDate;
    return undefined;
  });

  const [price, setPrice] = useState<string>(() => {
    if (isEditing && editingProduce?.price != null) {
      return String(editingProduce.price);
    }
    return "";
  });

  const [crateIdsOpen, setCrateIdsOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Apply bridge result from CrateWeightAndPricing ─────────────────────────
  useEffect(() => {
    if (!crateWeightPricingResult) return;
    const { crates: bridgeCrates, price: bridgePrice } = crateWeightPricingResult;
    setCrates(
      bridgeCrates.map((c) => ({
        weight: c.weight,
        tag: c.tag ?? "",
        isSellable: c.isSellable,
      }))
    );
    setNumberOfCrates(bridgeCrates.length);
    if (bridgePrice != null) setPrice(String(bridgePrice));
    setCrateWeightPricingResult(null);
  }, [crateWeightPricingResult]);

  // ── Guard ───────────────────────────────────────────────────────────────────
  if (!coolingUnit || !farmer || !crop) {
    if (typeof window !== "undefined") router.replace(ROUTES.CHECK_IN);
    return null;
  }

  // After guard, these are guaranteed non-null
  const safeCoolingUnit = coolingUnit;
  const safeCrop = crop;

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleNumberOfCratesChange(n: number) {
    const clamped = Math.max(1, n);
    setNumberOfCrates(clamped);

    if (clamped > crates.length) {
      const extras = Array.from({ length: clamped - crates.length }, () => ({
        weight: crates[0]?.weight ?? defaultWeight,
        tag: "",
        isSellable: false,
      }));
      setCrates([...crates, ...extras]);
    } else if (clamped < crates.length) {
      setCrates(crates.slice(0, clamped));
    }
  }

  function navigateToCrateWeightPricing() {
    if (crates.length === 0) {
      setErrors({ numberOfCrates: "Add at least one crate first" });
      return;
    }
    const sellableWeight = crates
      .filter((c) => c.isSellable)
      .reduce((s, c) => s + c.weight, 0);
    const existingPricePerKg =
      sellableWeight > 0 ? (Number(price) || 0) / sellableWeight : 0;

    setCrateWeightPricingInput({
      crates: crates.map((c) => ({ weight: c.weight, tag: c.tag || undefined, isSellable: c.isSellable })),
      sellingPrice: existingPricePerKg,
      applyToAll: crates.every(
        (c, _, arr) => c.isSellable && c.weight === arr[0].weight
      ),
      companyCurrency: safeCoolingUnit.commonPricingType ? "USD" : "USD",
    });
    router.push(ROUTES.CHECK_IN_CRATE_WEIGHT_PRICING);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!numberOfCrates || numberOfCrates < 1) {
      errs.numberOfCrates = "At least one crate is required";
    }
    if (!harvestDate) {
      errs.harvestDate = "Please select when the crop was harvested";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function onSave() {
    if (!validate()) return;

    const newProduce: ProduceCrate = {
      crop: safeCrop,
      additionalInfo,
      crates: crates.map((c) => ({
        weight: c.weight,
        tag: c.tag || undefined,
        isSellable: c.isSellable,
        coolingUnitId: safeCoolingUnit.id,
        plannedDays: plannedDays ? Number(plannedDays) : undefined,
        checkOut: null,
      })),
      harvestDate,
      price: price ? Number(price) : undefined,
    };

    if (isEditing && editingProduce) {
      removeProduce(editingProduce);
      setEditingProduce(null);
    } else {
      setPendingCrop(null);
    }

    addProduce(newProduce);
    router.push(ROUTES.CHECK_IN);
  }

  function onCancel() {
    setCrateWeightPricingResult(null);
    setPendingCrop(null);
    setEditingProduce(null);
    router.push(ROUTES.CHECK_IN);
  }

  // ── Pricing preview ─────────────────────────────────────────────────────────
  const pricingLabel = useMemo(() => {
    if (!safeCoolingUnit.commonPricingType) return "";
    const { pricingType } = safeCoolingUnit.commonPricingType;
    const metric = safeCoolingUnit.metric;
    if (pricingType === EPricingType.FIXED) return "Fixed price";
    return metric === ECoolingUnitMetric.KILOGRAMS
      ? "Price / day / kg"
      : "Price / day / crate";
  }, [coolingUnit]);

  const totalPricePreview = useMemo(
    () => calcPrice(crates, safeCoolingUnit, plannedDays ? Number(plannedDays) : undefined),
    [crates, safeCoolingUnit, plannedDays]
  );

  return (
    <>
      <div className="max-w-lg mx-auto px-4 pb-40 space-y-6">
        {/* Crop info */}
        <div className="flex items-center gap-3 py-2">
          {safeCrop.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={safeCrop.image} alt={safeCrop.name} className="w-12 h-12 object-contain" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-xl">
              🌿
            </div>
          )}
          <div>
            <p className="font-semibold">{safeCrop.name}</p>
            {additionalInfo && (
              <p className="text-sm text-muted-foreground">{additionalInfo}</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Details section */}
        <div className="space-y-4">
          <p className="text-sm font-bold text-green-700">Details</p>

          {/* Number of crates */}
          <div className="space-y-1">
            <Label className="text-sm">Number of Crates</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => handleNumberOfCratesChange(numberOfCrates - 1)}
              >
                <Minus size={14} />
              </Button>
              <Input
                type="number"
                min="1"
                className="w-20 text-center h-10"
                value={numberOfCrates}
                onChange={(e) => handleNumberOfCratesChange(Number(e.target.value))}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => handleNumberOfCratesChange(numberOfCrates + 1)}
              >
                <Plus size={14} />
              </Button>
            </div>
            {errors.numberOfCrates && (
              <p className="text-xs text-red-500">{errors.numberOfCrates}</p>
            )}
          </div>

          {/* Crate weight & pricing */}
          <button
            className={cn(
              "w-full flex items-center justify-between py-3 text-sm",
              crates.length === 0 && "opacity-40 cursor-not-allowed"
            )}
            onClick={navigateToCrateWeightPricing}
            disabled={crates.length === 0}
          >
            <span>Crate Weight &amp; Individual IDs</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
          <Separator />

          {/* Individual crate IDs */}
          <button
            className="w-full flex items-center justify-between py-3 text-sm"
            onClick={() => setCrateIdsOpen(true)}
          >
            <span>Individual Crate IDs / Tags</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
          <Separator />
        </div>

        {/* Storage section */}
        <div className="space-y-4">
          <p className="text-sm font-bold text-green-700">Storage</p>

          {/* Planned days */}
          <div className="space-y-1">
            <Label className="text-sm">Planned Storage Days</Label>
            <Input
              type="number"
              min="1"
              className="h-10"
              placeholder="e.g. 7"
              value={plannedDays}
              onChange={(e) => setPlannedDays(e.target.value)}
            />
          </div>

          {/* Harvest date */}
          <div className="space-y-2">
            <Label className="text-sm">Harvest Date</Label>
            <div className="space-y-2">
              {HARVEST_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setHarvestDate(opt.value);
                    setErrors((e) => ({ ...e, harvestDate: "" }));
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors",
                    harvestDate === opt.value
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 hover:bg-accent"
                  )}
                >
                  <span>{opt.label}</span>
                  {harvestDate === opt.value && <Check size={15} />}
                </button>
              ))}
            </div>
            {errors.harvestDate && (
              <p className="text-xs text-red-500">{errors.harvestDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Crate IDs modal */}
      <CrateIdsModal
        open={crateIdsOpen}
        crates={crates}
        onSave={setCrates}
        onClose={() => setCrateIdsOpen(false)}
      />

      {/* Floating footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between px-4 py-2.5 bg-teal-50 text-sm">
            <span className="text-muted-foreground">{pricingLabel}</span>
            <div className="text-right">
              <span className="font-bold text-green-700">
                {safeCoolingUnit.commonPricingType
                  ? formatCurrency("USD", safeCoolingUnit.commonPricingType.price.toFixed(2))
                  : "—"}
              </span>
              <span className="ml-2 text-muted-foreground">
                Total: {formatCurrency("USD", totalPricePreview)}
              </span>
            </div>
          </div>
          <Separator />
          <div className="flex gap-3 px-4 py-3">
            <Button
              variant="outline"
              className="flex-1 border-2 border-green-600 text-green-700 hover:bg-green-50 gap-1"
              onClick={onCancel}
            >
              <X size={15} />
              Cancel
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 gap-1"
              onClick={onSave}
            >
              <Check size={15} />
              Save
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
