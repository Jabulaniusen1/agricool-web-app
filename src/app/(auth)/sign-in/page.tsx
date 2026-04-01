"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Tractor, HardHat, Briefcase } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { signInSchema, SignInFormValues } from "@/constants/schemas";
import { authService } from "@/services/auth-service";
import { useAuthStore } from "@/stores/auth";
import { ROUTES } from "@/constants/routes";

const USER_TYPES = [
  {
    value: "f" as const,
    label: "Farmer",
    description: "Cooling user",
    icon: Tractor,
  },
  {
    value: "op" as const,
    label: "Operator",
    description: "Manage cold rooms",
    icon: HardHat,
  },
  {
    value: "sp" as const,
    label: "Service Provider",
    description: "Company employee",
    icon: Briefcase,
  },
];

export default function SignInPage() {
  const router = useRouter();
  const { setSession } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedType, setSelectedType] = useState<"f" | "op" | "sp" | null>(null);

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  const handleSelectType = (value: "f" | "op" | "sp") => {
    setSelectedType(value);
    setValue("userType", value, { shouldValidate: true });
  };

  const onSubmit = async (values: SignInFormValues) => {
    try {
      const username =
        values.userType !== "sp" && !values.username.startsWith("+")
          ? `+234${values.username}`
          : values.username;
      const res = await authService.signIn({ ...values, username });
      setSession({ access: res.access, refresh: res.refresh }, res.user);
      router.replace(ROUTES.DASHBOARD);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Sign in failed";
      toast.error(message);
    }
  };

  return (
    <Card className="shadow-xl border-0">
      <CardHeader className="text-center space-y-3">
        <div className="flex justify-center">
          <Image
            src="/agricool_logo.png"
            alt="Agricool"
            width={56}
            height={56}
            className="object-contain"
          />
        </div>
        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
        <CardDescription>Sign in to your Agricool account</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* User type selector */}
          <div className="space-y-2">
            <Label>I am a&hellip;</Label>
            <div className="grid grid-cols-3 gap-3">
              {USER_TYPES.map(({ value, label, description, icon: Icon }) => {
                const active = selectedType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleSelectType(value)}
                    className={[
                      "flex flex-col items-center gap-2 rounded-xl border-2 px-2 py-4 text-center transition-all",
                      "hover:border-green-500 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500",
                      active
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-border bg-background text-muted-foreground",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-10 w-10 items-center justify-center rounded-full",
                        active ? "bg-green-600 text-white" : "bg-muted text-muted-foreground",
                      ].join(" ")}
                    >
                      <Icon size={20} />
                    </span>
                    <span className="text-xs font-semibold leading-tight">{label}</span>
                    <span className="text-[10px] leading-tight opacity-70">{description}</span>
                  </button>
                );
              })}
            </div>
            {errors.userType && (
              <p className="text-sm text-destructive">{errors.userType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">
              {selectedType === "sp" ? "Email" : "Phone number"}
            </Label>
            {selectedType === "sp" ? (
              <Input
                id="username"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                {...register("username")}
              />
            ) : (
              <div className="flex">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground select-none">
                  +234
                </span>
                <Input
                  id="username"
                  type="tel"
                  placeholder="8012345678"
                  autoComplete="tel"
                  className="rounded-l-none"
                  {...register("username")}
                />
              </div>
            )}
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href={ROUTES.PASSWORD_RECOVERY}
                className="text-sm text-green-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href={ROUTES.SIGN_UP} className="text-green-600 hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
