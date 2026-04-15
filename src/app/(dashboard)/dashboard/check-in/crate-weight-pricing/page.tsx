"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Check, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useCheckInStore } from "@/stores/check-in";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

type CrateRow = {
  weight: number;
  tag?: string;
  isSellable: boolean;
};

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

export default function CrateWeightAndPricingPage() {
  const router = useRouter();

  const {
    coolingUnit,
    farmer,
    crateWeightPricingInput,
    setCrateWeightPricingResult,
    setCrateWeightPricingInput,
  } = useCheckInStore();

  // ── Guard ───────────────────────────────────────────────────────────────────
  if (!coolingUnit || !farmer || !crateWeightPricingInput) {
    if (typeof window !== "undefined") router.replace(ROUTES.CHECK_IN);
    return null;
  }

  const { crates: initialCrates, sellingPrice, applyToAll: initialApplyAll, companyCurrency } =
    crateWeightPricingInput;

  // ── State ───────────────────────────────────────────────────────────────────
  const [applyToAll, setApplyToAll] = useState(initialApplyAll);
  const [crates, setCrates] = useState<CrateRow[]>(
    initialCrates.map((c) => ({ ...c }))
  );
  const [pricePerKg, setPricePerKg] = useState<string>(
    sellingPrice > 0 ? sellingPrice.toFixed(2) : ""
  );

  const areTagsDefined = crates.some((c) => c.tag);
  const hasAnySellable = crates.some((c) => c.isSellable);

  const totalSellableWeight = useMemo(
    () =>
      crates
        .filter((c) => c.isSellable)
        .reduce((s, c) => s + c.weight, 0),
    [crates]
  );

  const potentialPrice = useMemo(() => {
    const parsed = Number(pricePerKg);
    if (isNaN(parsed) || parsed === 0) return 0;
    return totalSellableWeight * parsed;
  }, [totalSellableWeight, pricePerKg]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  function setWeight(index: number, delta: number, absolute?: number) {
    setCrates((prev) => {
      const updated = prev.map((c, i) => {
        if (applyToAll || i === index) {
          const newWeight =
            absolute !== undefined
              ? absolute
              : Math.max(0, c.weight + delta);
          return { ...c, weight: newWeight };
        }
        return c;
      });
      return updated;
    });
  }

  function toggleSellable(index: number) {
    setCrates((prev) =>
      prev.map((c, i) => {
        if (applyToAll || i === index) return { ...c, isSellable: !c.isSellable };
        return c;
      })
    );
  }

  function handleApplyToAll(checked: boolean) {
    setApplyToAll(checked);
    if (checked) {
      const first = crates[0];
      setCrates((prev) =>
        prev.map((c) => ({
          ...c,
          weight: first.weight,
          isSellable: first.isSellable,
        }))
      );
    }
  }

  function onSave() {
    setCrateWeightPricingResult({
      crates: crates.map((c) => ({
        weight: c.weight,
        tag: c.tag,
        isSellable: c.isSellable,
      })),
      price: potentialPrice > 0 ? potentialPrice : undefined,
    });
    setCrateWeightPricingInput(null);
    router.back();
  }

  function onCancel() {
    setCrateWeightPricingInput(null);
    router.back();
  }

  return (
    <>
      <div className="max-w-lg mx-auto px-3 pt-3 pb-40 space-y-4">
        {/* Apply to all */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm">Apply weight &amp; settings to all crates</span>
          <Checkbox
            checked={applyToAll}
            onCheckedChange={(v) => handleApplyToAll(v === true)}
          />
        </div>
        <Separator />

        {/* Crate rows */}
        <div className="space-y-4">
          {crates.map((crate, index) => {
            const isDisabled = applyToAll && index > 0;
            return (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-4 py-2",
                  isDisabled && "opacity-40"
                )}
              >
                {/* Crate label */}
                <div className="flex flex-col items-center w-12 shrink-0">
                  <span className="text-xl">🧺</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {areTagsDefined ? (crate.tag ?? "—") : `#${index + 1}`}
                  </span>
                </div>

                {/* Weight stepper */}
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Weight (kg)
                  </Label>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      disabled={isDisabled || crate.weight <= 0}
                      onClick={() => setWeight(index, -1)}
                    >
                      <Minus size={13} />
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      className="h-10 text-center w-20"
                      value={crate.weight}
                      readOnly={applyToAll && index > 0}
                      onChange={(e) =>
                        !isDisabled && setWeight(index, 0, Number(e.target.value))
                      }
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      disabled={isDisabled}
                      onClick={() => setWeight(index, 1)}
                    >
                      <Plus size={13} />
                    </Button>
                  </div>
                </div>

                {/* Sellable toggle */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <Label className="text-xs text-muted-foreground">List for sale</Label>
                  <Checkbox
                    checked={crate.isSellable}
                    disabled={isDisabled}
                    onCheckedChange={() => !isDisabled && toggleSellable(index)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Selling price (shown when any crate is sellable) */}
        {hasAnySellable && (
          <div className="space-y-2 pb-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">
                Selling Price ({companyCurrency}/kg)
              </Label>
            </div>
            <Input
              type="number"
              min="0"
              step="0.01"
              className="h-11"
              placeholder="0.00"
              value={pricePerKg}
              onChange={(e) => setPricePerKg(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Floating footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10">
        <div className="max-w-lg mx-auto">
          {hasAnySellable && potentialPrice > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-teal-50">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">Potential selling price</span>
                <Info size={14} className="text-muted-foreground" />
              </div>
              <span className="font-bold text-green-700 text-sm">
                {formatCurrency(companyCurrency, potentialPrice.toFixed(2))}
              </span>
            </div>
          )}
          <Separator />
          <div className="flex items-center justify-center px-4 py-3">
            <Button
              className="w-full bg-green-600 hover:bg-green-700 gap-1 uppercase tracking-wide"
              onClick={onSave}
            >
              <Check size={15} />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
