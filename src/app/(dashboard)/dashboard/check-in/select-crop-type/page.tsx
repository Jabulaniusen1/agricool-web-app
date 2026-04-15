"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useCheckInStore } from "@/stores/check-in";
import { ECropType } from "@/types/global";
import { ROUTES } from "@/constants/routes";

const CROP_TYPE_OPTIONS = [
  { id: ECropType.FRUITS, label: "Fruits" },
  { id: ECropType.VEGETABLES, label: "Vegetables" },
  { id: ECropType.ROOT_VEGETABLES, label: "Root Vegetables" },
  { id: ECropType.OTHER, label: "Other" },
];

export default function SelectCropTypePage() {
  const router = useRouter();
  const { coolingUnit, farmer } = useCheckInStore();

  // Guard: redirect if setup not complete
  if (!coolingUnit || !farmer) {
    if (typeof window !== "undefined") router.replace(ROUTES.CHECK_IN);
    return null;
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mt-2">
        {CROP_TYPE_OPTIONS.map((option, idx) => (
          <div key={option.id}>
            <button
              className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-accent transition-colors"
              onClick={() => router.push(ROUTES.CHECK_IN_CROPS(option.id))}
            >
              <span className="text-sm font-medium">{option.label}</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
            {idx < CROP_TYPE_OPTIONS.length - 1 && <Separator />}
          </div>
        ))}
      </div>
    </div>
  );
}
