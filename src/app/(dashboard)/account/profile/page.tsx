"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { User, Save, Camera, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import "@/i18n";

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
import { Separator } from "@/components/ui/separator";

import { useAuthStore } from "@/stores/auth";
import { coldtivateService } from "@/services/coldtivate-service";
import { profileSchema, ProfileFormValues } from "@/constants/schemas";
import { EApiGender, ERoles } from "@/types/global";
import { getInitials } from "@/lib/utils";
import { LANGUAGE_KEY } from "@/i18n";

const ROLE_META: Record<ERoles, { label: string; color: string; description: string }> = {
  [ERoles.AUTH]:             { label: "Unverified",       color: "bg-gray-100 text-gray-700 border-gray-200",         description: "Account pending verification" },
  [ERoles.COOLING_USER]:     { label: "Cooling User",     color: "bg-blue-50 text-blue-700 border-blue-200",          description: "Can monitor and use cooling units" },
  [ERoles.FARMER]:           { label: "Farmer",           color: "bg-emerald-50 text-emerald-700 border-emerald-200", description: "Can store produce in cooling units" },
  [ERoles.OPERATOR]:         { label: "Operator",         color: "bg-orange-50 text-orange-700 border-orange-200",    description: "Can manage users and operations" },
  [ERoles.SERVICE_PROVIDER]: { label: "Service Provider", color: "bg-green-50 text-green-700 border-green-200",       description: "Full access — manages the company and units" },
};

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "yo", label: "Yoruba" },
  { value: "ha", label: "Hausa" },
  { value: "ig", label: "Igbo" },
  { value: "pg", label: "Pidgin" },
];

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { i18n } = useTranslation();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: user
      ? {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email ?? "",
          phone: user.phone,
          gender: user.gender ?? "",
          language: user.language ?? "en",
        }
      : undefined,
  });

  async function onSubmit(values: ProfileFormValues) {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await coldtivateService.updateUser(user.id, {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email || undefined,
        phone: values.phone,
        gender: (values.gender as EApiGender) || undefined,
        language: values.language,
      });
      updateUser(updated);
      const selectedLanguage = values.language ?? "en";
      i18n.changeLanguage(selectedLanguage);
      localStorage.setItem(LANGUAGE_KEY, selectedLanguage);
      document.documentElement.lang = selectedLanguage;
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Not logged in
      </div>
    );
  }

  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <User size={20} className="text-green-600" />
          My Profile
        </h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Update your personal information
        </p>
      </div>

      {/* Identity card */}
      <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xl font-bold select-none">
            {getInitials(fullName)}
          </div>
          <button
            type="button"
            className="absolute -bottom-1 -right-1 rounded-full bg-white border border-gray-200 shadow-sm p-1.5 hover:bg-gray-50 transition-colors"
            title="Change avatar (not implemented)"
          >
            <Camera size={11} className="text-gray-500" />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 truncate">{fullName}</p>
          <p className="text-sm text-muted-foreground truncate">{user.email ?? user.phone}</p>
          {/* Role badge — always shown */}
          {(() => {
            const meta = user.role ? ROLE_META[user.role] : null;
            return (
              <span className={`inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta ? meta.color : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                <ShieldCheck size={11} />
                {meta ? meta.label : "No role assigned"}
              </span>
            );
          })()}
        </div>
      </div>

      {/* Account type banner */}
      {(() => {
        const meta = user.role ? ROLE_META[user.role] : null;
        return (
          <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${meta ? meta.color : "bg-gray-50 text-gray-600 border-gray-200"}`}>
            <ShieldCheck size={18} className="shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{meta ? meta.label : "Unknown account type"}</p>
              <p className="text-xs opacity-75">{meta ? meta.description : "Your account role has not been set"}</p>
            </div>
          </div>
        );
      })()}

      <Separator />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...register("firstName")} placeholder="John" />
                {errors.firstName && (
                  <p className="text-xs text-red-500">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...register("lastName")} placeholder="Doe" />
                {errors.lastName && (
                  <p className="text-xs text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="+234 800 000 0000"
              />
              {errors.phone && (
                <p className="text-xs text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Account Type</Label>
              <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-muted/40">
                {(() => {
                  const meta = user.role ? ROLE_META[user.role] : null;
                  return (
                    <>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta ? meta.color : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                        <ShieldCheck size={10} />
                        {meta ? meta.label : "Not assigned"}
                      </span>
                      <span className="text-xs text-muted-foreground">read only</span>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Gender</Label>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EApiGender.MALE}>Male</SelectItem>
                        <SelectItem value={EApiGender.FEMALE}>Female</SelectItem>
                        <SelectItem value={EApiGender.OTHER}>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1">
                <Label>Language</Label>
                <Controller
                  control={control}
                  name="language"
                  render={({ field }) => (
                    <Select value={field.value ?? "en"} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

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
