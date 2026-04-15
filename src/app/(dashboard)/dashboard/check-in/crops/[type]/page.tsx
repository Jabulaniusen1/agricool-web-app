"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCheckInStore } from "@/stores/check-in";
import { useCoolingUnit } from "@/hooks/use-cooling-units";
import { ROUTES } from "@/constants/routes";
import { ECropType } from "@/types/global";

const CROP_TYPE_LABELS: Record<string, string> = {
  [ECropType.FRUITS]: "Fruits",
  [ECropType.VEGETABLES]: "Vegetables",
  [ECropType.ROOT_VEGETABLES]: "Root Vegetables",
  [ECropType.OTHER]: "Other",
};

export default function CropListPage() {
  const router = useRouter();
  const params = useParams<{ type: string }>();
  const cropType = params.type ?? "";

  const [search, setSearch] = useState("");
  const additionalInfoRef = useRef<Record<number, string>>({});

  const { coolingUnit, farmer, setPendingCrop } = useCheckInStore();

  // Guard
  if (!coolingUnit || !farmer) {
    if (typeof window !== "undefined") router.replace(ROUTES.CHECK_IN);
    return null;
  }

  // Fetch full cooling unit detail to get the crops list
  // (the list endpoint returns crops: [] — only the detail endpoint populates it)
  const { data: unitDetail, isLoading: cropsLoading } = useCoolingUnit(coolingUnit.id);
  const crops = unitDetail?.crops ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return crops;
    return crops.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [crops, search]);

  const typeLabel = CROP_TYPE_LABELS[cropType] ?? cropType;

  return (
    <div className="max-w-lg mx-auto">
      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            className="pl-9 h-11"
            placeholder={`Search ${typeLabel.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {cropsLoading && (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {!cropsLoading && filtered.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          No crops found
        </p>
      )}

      <div>
        {filtered.map((crop, idx) => (
          <div key={crop.id}>
            <div className="flex items-center gap-3 px-3 py-2">
              {/* Crop image */}
              {crop.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={crop.image}
                  alt={crop.name}
                  className="w-16 h-16 object-contain flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl flex-shrink-0">
                  🌿
                </div>
              )}

              {/* Crop name */}
              <span className="flex-1 text-sm font-medium">{crop.name}</span>

              {/* Additional info input */}
              <Input
                className="w-32 h-10 text-xs"
                placeholder="Additional info"
                onChange={(e) => {
                  additionalInfoRef.current[crop.id] = e.target.value;
                }}
              />

              {/* Add button */}
              <button
                className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center text-green-700 font-bold text-lg transition-colors flex-shrink-0"
                onClick={() => {
                  setPendingCrop({
                    crop,
                    additionalInfo: additionalInfoRef.current[crop.id] ?? "",
                  });
                  router.push(ROUTES.CHECK_IN_CRATE_SETUP);
                }}
                aria-label={`Add ${crop.name}`}
              >
                +
              </button>
            </div>
            {idx < filtered.length - 1 && <Separator />}
          </div>
        ))}
      </div>
    </div>
  );
}
