"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ShoppingBasket,
  Ticket,
  Pencil,
  Trash2,
  Check,
  Loader2,
  X,
  ChevronRight,
} from "lucide-react";
import { mutate as swrMutate } from "swr";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import { useFarmers } from "@/hooks/use-farmers";
import { useCoolingUnits } from "@/hooks/use-cooling-units";
import { useCheckInStore, ProduceCrate } from "@/stores/check-in";
import { useDashboardStore } from "@/stores/dashboard";
import { coldtivateService } from "@/services/coldtivate-service";
import { marketplaceService } from "@/services/marketplace-service";
import {
  Farmer,
  CoolingUnit,
  EPricingType,
  ECoolingUnitMetric,
  EDateCropped,
} from "@/types/global";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const DEFAULT_CURRENCY = "USD";

function resolveHarvestDate(dateType: EDateCropped | undefined): string | undefined {
  if (!dateType) return undefined;
  const d = new Date();
  switch (dateType) {
    case EDateCropped.TODAY:
      return d.toISOString().split("T")[0];
    case EDateCropped.YESTERDAY:
      d.setDate(d.getDate() - 1);
      return d.toISOString().split("T")[0];
    case EDateCropped.DAY_BEFORE:
      d.setDate(d.getDate() - 2);
      return d.toISOString().split("T")[0];
    case EDateCropped.EVEN_BEFORE:
      d.setDate(d.getDate() - 3);
      return d.toISOString().split("T")[0];
  }
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

// ─── Produce Card ─────────────────────────────────────────────────────────────

function ProduceCard({
  item,
  coolingUnit,
  currencyCode,
  checkOutCode,
  onEdit,
  onDelete,
  disabled,
}: {
  item: ProduceCrate;
  coolingUnit: CoolingUnit;
  currencyCode: string;
  checkOutCode: string | null;
  onEdit: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const totalWeight = item.crates.reduce((s, c) => s + c.weight, 0);
  const hasSellable = item.crates.some((c) => c.isSellable);

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {item.crop.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.crop.image}
                alt={item.crop.name}
                className="w-10 h-10 rounded-md object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-md bg-green-100 flex items-center justify-center text-lg">
                🌿
              </div>
            )}
            <div>
              <p className="font-semibold text-sm">{item.crop.name}</p>
              {item.additionalInfo ? (
                <p className="text-xs text-muted-foreground">{item.additionalInfo}</p>
              ) : null}
            </div>
          </div>
          {!checkOutCode && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onEdit}
                disabled={disabled}
              >
                <Pencil size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={onDelete}
                disabled={disabled}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>{item.crates.length} crate{item.crates.length !== 1 ? "s" : ""}</span>
          <span>{totalWeight.toFixed(1)} kg total</span>
          {item.crates[0]?.plannedDays != null && (
            <span>{item.crates[0].plannedDays} planned day{item.crates[0].plannedDays !== 1 ? "s" : ""}</span>
          )}
          {hasSellable && (
            <Badge variant="outline" className="text-green-600 border-green-300 text-[10px] px-1.5">
              Listed
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Check-In With Code Modal ─────────────────────────────────────────────────

function CheckInWithCodeModal({
  open,
  onClose,
  coolingUnit,
}: {
  open: boolean;
  onClose: () => void;
  coolingUnit: CoolingUnit;
}) {
  const [code, setCode] = useState("");
  const [plannedDays, setPlannedDays] = useState("");
  const [loading, setLoading] = useState(false);
  const { addProduce, setCheckOutCode } = useCheckInStore();

  async function onSubmit() {
    if (!code.trim()) {
      toast.error("Please enter a checkout code");
      return;
    }
    setLoading(true);
    try {
      const result = await coldtivateService.getMoveCheckout(code.trim());
      const produce = result.produce;

      addProduce({
        crop: {
          id: produce.cropId,
          name: produce.cropName,
          image: produce.cropImage,
        },
        additionalInfo: "",
        crates: produce.checkedInCrates.map((crate) => ({
          weight: crate.initialWeight,
          tag: crate.tag ?? "",
          isSellable: false,
          coolingUnitId: coolingUnit.id,
          plannedDays: plannedDays ? Number(plannedDays) : undefined,
          checkOut: null,
        })),
        harvestDate: undefined,
        price: undefined,
      });

      setCheckOutCode(code.trim());
      onClose();
    } catch {
      toast.error("Invalid code or code not found");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Check-In with Code</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Enter a checkout code to re-check in produce from another unit.
        </p>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Code</Label>
            <Input
              className="mt-1"
              placeholder="Enter checkout code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Planned Days (optional)</Label>
            <Input
              className="mt-1"
              type="number"
              min="1"
              placeholder="e.g. 7"
              value={plannedDays}
              onChange={(e) => setPlannedDays(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={onSubmit}
            disabled={loading}
          >
            {loading && <Loader2 size={14} className="mr-2 animate-spin" />}
            <Check size={14} className="mr-1" />
            Confirm
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-red-300 text-red-500 hover:bg-red-50"
            onClick={onClose}
            disabled={loading}
          >
            <X size={14} className="mr-1" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Farmer Setup ─────────────────────────────────────────────────────────────

function FarmerSetup({
  onConfirm,
}: {
  onConfirm: (farmer: Farmer, coolingUnit: CoolingUnit) => void;
}) {
  const [farmerSearch, setFarmerSearch] = useState("");
  const [cuSearch, setCuSearch] = useState("");
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [selectedCoolingUnit, setSelectedCoolingUnit] = useState<CoolingUnit | null>(null);

  const { data: farmers } = useFarmers();
  const { data: coolingUnits, isLoading: cuLoading } = useCoolingUnits();

  // Pre-select the cooling unit already chosen on the dashboard
  const { selectedCoolingUnitId: dashboardCuId } = useDashboardStore();
  useEffect(() => {
    if (dashboardCuId && coolingUnits && !selectedCoolingUnit) {
      const cu = coolingUnits.find((c) => c.id === dashboardCuId);
      if (cu) setSelectedCoolingUnit(cu);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coolingUnits, dashboardCuId]);

  const filteredFarmers = useMemo(() => {
    if (!farmers) return [];
    const q = farmerSearch.toLowerCase();
    return farmers.filter((f) => {
      const name = `${f.user.firstName} ${f.user.lastName}`.toLowerCase();
      const code = (f.code ?? "").toLowerCase();
      const phone = (f.user.phone ?? "").toLowerCase();
      return name.includes(q) || code.includes(q) || phone.includes(q);
    });
  }, [farmers, farmerSearch]);

  const filteredCoolingUnits = useMemo(() => {
    if (!coolingUnits) return [];
    if (!cuSearch.trim()) return coolingUnits;
    return coolingUnits.filter((cu) =>
      cu.name.toLowerCase().includes(cuSearch.toLowerCase())
    );
  }, [coolingUnits, cuSearch]);

  function handleContinue() {
    if (!selectedFarmer) { toast.error("Please select a farmer"); return; }
    if (!selectedCoolingUnit) { toast.error("Please select a cooling unit"); return; }
    onConfirm(selectedFarmer, selectedCoolingUnit);
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-bold">New Check-In</h2>
        <p className="text-sm text-muted-foreground">Select a farmer and cooling unit to begin</p>
      </div>

      {/* Farmer search */}
      <div className="space-y-2">
        <Label>Farmer</Label>
        <Input
          placeholder="Search by name, code, or phone..."
          value={farmerSearch}
          onChange={(e) => setFarmerSearch(e.target.value)}
        />
        <div className="max-h-56 overflow-y-auto space-y-1.5 border rounded-md p-2">
          {filteredFarmers.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-3">No farmers found</p>
          )}
          {filteredFarmers.map((farmer) => (
            <button
              key={farmer.id}
              type="button"
              onClick={() => setSelectedFarmer(farmer)}
              className={cn(
                "w-full flex items-center gap-3 p-2.5 rounded-lg border text-left hover:bg-accent transition-colors text-sm",
                selectedFarmer?.id === farmer.id
                  ? "border-green-500 bg-green-50"
                  : "border-transparent"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700 shrink-0">
                {farmer.user.firstName[0]}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">
                  {farmer.user.firstName} {farmer.user.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {farmer.code} · {farmer.user.phone}
                </p>
              </div>
              {selectedFarmer?.id === farmer.id && (
                <Check size={15} className="ml-auto text-green-600 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Cooling unit — rendered as a clickable list, same pattern as farmers */}
      <div className="space-y-2">
        <Label>Cooling Unit</Label>
        {coolingUnits && coolingUnits.length > 4 && (
          <Input
            placeholder="Search cooling units..."
            value={cuSearch}
            onChange={(e) => setCuSearch(e.target.value)}
          />
        )}
        <div className="max-h-48 overflow-y-auto space-y-1.5 border rounded-md p-2">
          {cuLoading && (
            <p className="text-center text-sm text-muted-foreground py-3">Loading…</p>
          )}
          {!cuLoading && filteredCoolingUnits.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-3">No cooling units found</p>
          )}
          {filteredCoolingUnits.map((cu) => (
            <button
              key={cu.id}
              type="button"
              onClick={() => setSelectedCoolingUnit(cu)}
              className={cn(
                "w-full flex items-center gap-3 p-2.5 rounded-lg border text-left hover:bg-accent transition-colors text-sm",
                selectedCoolingUnit?.id === cu.id
                  ? "border-green-500 bg-green-50"
                  : "border-transparent"
              )}
            >
              <div className="w-8 h-8 rounded-md bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700 shrink-0">
                ❄️
              </div>
              <span className="flex-1 font-medium truncate">{cu.name}</span>
              {selectedCoolingUnit?.id === cu.id && (
                <Check size={15} className="text-green-600 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      <Button
        className="w-full bg-green-600 hover:bg-green-700"
        onClick={handleContinue}
        disabled={!selectedFarmer || !selectedCoolingUnit}
      >
        Continue
        <ChevronRight size={16} className="ml-1" />
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CheckInPage() {
  const router = useRouter();
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    produces,
    coolingUnit,
    farmer,
    checkOutCode,
    setCoolingUnit,
    setFarmer,
    removeProduce,
    setEditingProduce,
    resetStore,
  } = useCheckInStore();

  // ── Pricing calculation (mirrors mobile logic) ──────────────────────────────
  const allHavePlannedDays = useMemo(
    () => produces.every((p) => p.crates.every((c) => c.plannedDays != null)),
    [produces]
  );

  const total = useMemo(() => {
    if (!coolingUnit?.commonPricingType) return "0.00";
    const { pricingType, price } = coolingUnit.commonPricingType;
    const metric = coolingUnit.metric;

    return produces
      .reduce((acc, produce) => {
        for (const crate of produce.crates) {
          const metricMultiplier =
            metric === ECoolingUnitMetric.KILOGRAMS ? crate.weight : 1;
          if (pricingType === EPricingType.FIXED) {
            acc += metricMultiplier * price;
          } else {
            const multiplier = allHavePlannedDays ? (crate.plannedDays ?? 1) : 1;
            acc += metricMultiplier * multiplier * price;
          }
        }
        return acc;
      }, 0)
      .toFixed(2);
  }, [coolingUnit, produces, allHavePlannedDays]);

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function onSubmit() {
    if (!farmer || !coolingUnit) return;
    if (produces.length === 0) {
      toast.error("Please add at least one produce before confirming");
      return;
    }

    setIsSubmitting(true);
    try {
      if (checkOutCode) {
        // Check-in with code path
        await coldtivateService.checkInWithCode(checkOutCode, {
          farmerId: farmer.id,
          coolingUnitId: coolingUnit.id,
        });
      } else {
        // Normal path: one API call per produce (crop)
        const results = await Promise.all(
          produces.map((produce) =>
            coldtivateService.checkIn({
              farmerId: farmer.id,
              coolingUnitId: coolingUnit.id,
              cropId: produce.crop.id,
              crates: produce.crates.map((c) => ({
                weight: c.weight,
                tag: c.tag,
                plannedDays: c.plannedDays,
                harvestDate: resolveHarvestDate(produce.harvestDate),
              })),
            })
          )
        );

        // Update farmer's cooling unit association
        await coldtivateService.updateFarmer(farmer.id, {
          coolingUnit: coolingUnit.id,
        } as Partial<typeof farmer>);

        // Marketplace listing for sellable crates
        await Promise.allSettled(
          results.flatMap((checkInResult, idx) => {
            const produce = produces[idx];
            const priceSafe = produce.price ?? 0;
            if (priceSafe === 0) return [];

            const sellableWeight = produce.crates
              .filter((c) => c.isSellable)
              .reduce((s, c) => s + c.weight, 0);
            if (sellableWeight === 0) return [];

            const pricePerKg = priceSafe / sellableWeight;

            return checkInResult.crates
              .filter((_, i) => produce.crates[i]?.isSellable)
              .map((crate) =>
                marketplaceService.listCrate({
                  crateId: crate.id,
                  pricePerUnit: pricePerKg,
                })
              );
          })
        );
      }

      toast.success("Check-in successful!");
      swrMutate(`produces/${coolingUnit.id}`);
      resetStore();
      router.push(ROUTES.DASHBOARD);
    } catch {
      toast.error("Check-in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Setup mode ──────────────────────────────────────────────────────────────
  if (!farmer || !coolingUnit) {
    return (
      <FarmerSetup
        onConfirm={(f, cu) => {
          setFarmer(f);
          setCoolingUnit(cu);
        }}
      />
    );
  }

  // ── Review mode ─────────────────────────────────────────────────────────────
  const currencyCode = coolingUnit?.commonPricingType
    ? DEFAULT_CURRENCY
    : DEFAULT_CURRENCY;

  return (
    <div className="max-w-lg mx-auto pb-36 space-y-4">
      {/* Header info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-medium">Cooling User</span>
          <span className="font-semibold">{farmer.user.firstName} {farmer.user.lastName}</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-medium">Cooling Unit</span>
          <span className="font-semibold">{coolingUnit.name}</span>
        </div>
        <Separator />
      </div>

      {/* Produces list */}
      {produces.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Crates Added
        </p>
      )}

      {produces.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          No crates added yet. Tap &quot;Add Crates&quot; to get started.
        </p>
      )}

      <div className="space-y-3">
        {produces.map((item, index) => (
          <ProduceCard
            key={`${item.crop.id}-${index}`}
            item={item}
            coolingUnit={coolingUnit}
            currencyCode={currencyCode}
            checkOutCode={checkOutCode}
            disabled={isSubmitting}
            onEdit={() => {
              setEditingProduce(item);
              router.push(ROUTES.CHECK_IN_CRATE_SETUP);
            }}
            onDelete={() => removeProduce(item)}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="space-y-2 pt-2">
        {!checkOutCode && (
          <Button
            variant="outline"
            className="w-full border-2 border-green-600 text-green-700 hover:bg-green-50 gap-2"
            onClick={() => router.push(ROUTES.CHECK_IN_SELECT_CROP_TYPE)}
            disabled={isSubmitting}
          >
            <ShoppingBasket size={16} />
            Add Crates
          </Button>
        )}
        {produces.length === 0 && (
          <Button
            variant="outline"
            className="w-full border-2 border-green-600 text-green-700 hover:bg-green-50 gap-2"
            onClick={() => setIsCodeModalOpen(true)}
            disabled={isSubmitting}
          >
            <Ticket size={16} />
            Check-In with Code
          </Button>
        )}
      </div>

      {/* Pricing note */}
      {!allHavePlannedDays &&
        coolingUnit.commonPricingType?.pricingType !== EPricingType.FIXED && (
          <p className="text-xs text-muted-foreground">
            Estimated cost will be calculated once planned days are set for all crates.
          </p>
        )}

      {/* Code modal */}
      <CheckInWithCodeModal
        open={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        coolingUnit={coolingUnit}
      />

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between px-4 py-3 bg-teal-50">
            <span className="font-bold text-sm">
              {allHavePlannedDays ? "Estimated Cost" : "Pricing"}
            </span>
            <span className="font-bold text-green-700">
              {formatCurrency(currencyCode, total)}
              {coolingUnit.commonPricingType?.pricingType !== EPricingType.FIXED &&
                !allHavePlannedDays
                ? " / day"
                : ""}
            </span>
          </div>
          <Separator />
          <div className="flex gap-3 px-4 py-3">
            <Button
              variant="outline"
              className="flex-1 border-2 border-green-600 text-green-700 hover:bg-green-50 gap-1"
              onClick={() => {
                resetStore();
                router.push(ROUTES.DASHBOARD);
              }}
              disabled={isSubmitting}
            >
              <X size={15} />
              Cancel
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 gap-1"
              onClick={onSubmit}
              disabled={produces.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Check size={15} />
              )}
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
