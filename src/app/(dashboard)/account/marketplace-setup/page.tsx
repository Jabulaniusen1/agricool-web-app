"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Store, CheckCircle2, XCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

import { useApiCall } from "@/hooks/use-api";
import { useCompanies } from "@/hooks/use-companies";
import { marketplaceService } from "@/services/marketplace-service";
import { MarketplaceSetup } from "@/types/global";

// ─── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  isSellerEnabled: z.boolean(),
  isBuyerEnabled: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MarketplaceSetupPage() {
  const { data: companies } = useCompanies();
  const companyId = companies?.[0]?.id ?? 0;
  const [saving, setSaving] = useState(false);

  const { data: setup, isLoading, mutate } = useApiCall<MarketplaceSetup>(
    "marketplace-setup",
    () => marketplaceService.getMarketplaceSetup()
  );

  const { control, handleSubmit, formState: { isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      isSellerEnabled: setup?.isSellerEnabled ?? false,
      isBuyerEnabled: setup?.isBuyerEnabled ?? false,
    },
  });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      await marketplaceService.createMarketplaceSetup({
        company: companyId,
        isSellerEnabled: values.isSellerEnabled,
        isBuyerEnabled: values.isBuyerEnabled,
      });
      toast.success("Marketplace setup saved");
      await mutate();
    } catch {
      toast.error("Failed to save marketplace setup");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-7 w-48 mb-1" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardContent className="space-y-6 pt-6">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Store size={20} className="text-green-600" />
          Marketplace Setup
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">Configure your marketplace seller and buyer permissions</p>
      </div>

      {/* Status overview */}
      {setup && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            {setup.isSellerEnabled
              ? <CheckCircle2 size={20} className="text-green-600 shrink-0" />
              : <XCircle size={20} className="text-gray-400 shrink-0" />}
            <div>
              <p className="font-medium text-sm">Seller</p>
              <p className="text-xs text-gray-500">{setup.isSellerEnabled ? "Enabled — can list products" : "Disabled"}</p>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            {setup.isBuyerEnabled
              ? <CheckCircle2 size={20} className="text-green-600 shrink-0" />
              : <XCircle size={20} className="text-gray-400 shrink-0" />}
            <div>
              <p className="font-medium text-sm">Buyer</p>
              <p className="text-xs text-gray-500">{setup.isBuyerEnabled ? "Enabled — can purchase products" : "Disabled"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Seller Mode</Label>
                <p className="text-xs text-gray-500 mt-0.5">Allow your company to list and sell produce on the marketplace</p>
              </div>
              <Controller
                control={control}
                name="isSellerEnabled"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Buyer Mode</Label>
                <p className="text-xs text-gray-500 mt-0.5">Allow your company to browse and purchase produce from the marketplace</p>
              </div>
              <Controller
                control={control}
                name="isBuyerEnabled"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={saving || !isDirty}
            >
              {saving ? "Saving..." : "Save Configuration"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
