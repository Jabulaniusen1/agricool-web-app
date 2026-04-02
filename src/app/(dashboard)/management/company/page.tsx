"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { mutate } from "swr";
import { Building2, Upload, Save } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";

import { useCompanies } from "@/hooks/use-companies";
import { coldtivateService } from "@/services/coldtivate-service";
import { Company } from "@/types/global";

// ─── Types ─────────────────────────────────────────────────────────────────────

type CompanyFormValues = {
  name: string;
  country: string;
  currency: string;
  crop: number[];
};

const CURRENCIES = ["NGN", "USD", "EUR", "GBP"];
const COUNTRIES = ["Nigeria"];
const CROPS = [
  { id: 1, name: "Tomato" },
  { id: 2, name: "Pepper" },
  { id: 3, name: "Onion" },
  { id: 4, name: "Leafy Greens" },
  { id: 5, name: "Mango" },
  { id: 6, name: "Banana" },
  { id: 7, name: "Orange" },
  { id: 8, name: "Potato" },
];

// ─── Page Skeleton ─────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-9 w-32" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CompanyPage() {
  const { data: companies, isLoading, mutate: revalidate } = useCompanies();
  const company: Company | undefined = companies?.[0];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCrops, setSelectedCrops] = useState<number[]>(company?.crop ?? []);

  const { register, handleSubmit, setValue, watch } = useForm<CompanyFormValues>({
    values: company
      ? { name: company.name, country: company.country ?? "", currency: company.currency, crop: company.crop }
      : { name: "", country: "", currency: "NGN", crop: [] },
  });

  async function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !company) return;

    setLogoPreview(URL.createObjectURL(file));
    setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append("logo", file);
      // Pass FormData to updateCompany — service accepts Partial<Company> but backend handles FormData
      await coldtivateService.updateCompany(company.id, formData as unknown as Partial<Company>);
      await revalidate();
      mutate("companies");
      toast.success("Logo updated successfully");
    } catch {
      toast.error("Failed to upload logo");
      setLogoPreview(null);
    } finally {
      setUploadingLogo(false);
    }
  }

  function toggleCrop(cropId: number) {
    setSelectedCrops((prev) =>
      prev.includes(cropId) ? prev.filter((id) => id !== cropId) : [...prev, cropId]
    );
  }

  async function onSubmit(values: CompanyFormValues) {
    if (!company) return;
    setSaving(true);
    try {
      await coldtivateService.updateCompany(company.id, {
        name: values.name,
        country: values.country,
        currency: values.currency,
        crop: selectedCrops,
      });
      await revalidate();
      mutate("companies");
      toast.success("Company profile saved");
    } catch {
      toast.error("Failed to save company profile");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <PageSkeleton />;
  if (!company) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        No company found
      </div>
    );
  }

  const logoSrc = logoPreview ?? company.logo ?? undefined;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Building2 size={20} className="text-green-600" />
          Company Profile
        </h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage your organization settings
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Company Logo</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={logoSrc} alt={company.name} />
              <AvatarFallback className="bg-green-100 text-green-700 text-xl font-bold">
                {company.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={uploadingLogo}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} />
                {uploadingLogo ? "Uploading..." : "Upload Logo"}
              </Button>
              <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Company Name</Label>
              <Input id="name" placeholder="Acme Cold Storage" {...register("name")} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Country</Label>
                <Select
                  value={watch("country")}
                  onValueChange={(v) => v && setValue("country", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Currency</Label>
                <Select
                  value={watch("currency")}
                  onValueChange={(v) => v && setValue("currency", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((cur) => (
                      <SelectItem key={cur} value={cur}>
                        {cur}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Crop Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supported Crop Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CROPS.map((crop) => (
                <label
                  key={crop.id}
                  className="flex items-center gap-2 cursor-pointer text-sm"
                >
                  <Checkbox
                    checked={selectedCrops.includes(crop.id)}
                    onCheckedChange={() => toggleCrop(crop.id)}
                  />
                  {crop.name}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-green-600 hover:bg-green-700 gap-2"
            disabled={saving}
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
