"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { User, Save, Camera } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import { useAuthStore } from "@/stores/auth";
import { coldtivateService } from "@/services/coldtivate-service";
import { profileSchema, ProfileFormValues } from "@/constants/schemas";
import { EApiGender } from "@/types/global";
import { getInitials } from "@/lib/utils";
import { LANGUAGE_KEY } from "@/i18n";

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

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-green-100 text-green-700 text-xl font-bold">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            className="absolute -bottom-1 -right-1 rounded-full bg-white border shadow p-1 hover:bg-gray-50"
            title="Change avatar (not implemented)"
          >
            <Camera size={12} className="text-muted-foreground" />
          </button>
        </div>
        <div>
          <p className="font-semibold">{fullName}</p>
          <p className="text-sm text-muted-foreground">{user.email ?? user.phone}</p>
          {user.role && (
            <p className="text-xs text-green-600 capitalize mt-0.5">
              {user.role.toLowerCase().replace("_", " ")}
            </p>
          )}
        </div>
      </div>

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
