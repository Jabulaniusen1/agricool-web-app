"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2, Tractor, HardHat, Briefcase } from "lucide-react";
import { toast } from "sonner";

import { signInSchema, SignInFormValues } from "@/constants/schemas";
import { authService } from "@/services/auth-service";
import { useAuthStore } from "@/stores/auth";
import { ROUTES } from "@/constants/routes";

const USER_TYPES = [
  { value: "f" as const,  label: "Farmer",           description: "Cooling user",      icon: Tractor  },
  { value: "op" as const, label: "Operator",          description: "Manage cold rooms", icon: HardHat  },
  { value: "sp" as const, label: "Service Provider",  description: "Company employee",  icon: Briefcase },
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
  } = useForm<SignInFormValues>({ resolver: zodResolver(signInSchema) });

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
      toast.error((err as { message?: string })?.message ?? "Sign in failed");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-8">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
          <Image src="/agricool_logo.png" alt="Agricool" width={36} height={36} className="object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-sm text-gray-500 mt-1">Sign in to your Agricool account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* User type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">I am a…</label>
          <div className="grid grid-cols-3 gap-2">
            {USER_TYPES.map(({ value, label, description, icon: Icon }) => {
              const active = selectedType === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleSelectType(value)}
                  className={[
                    "flex flex-col items-center gap-2 rounded-xl border-2 px-2 py-3.5 text-center transition-all",
                    active
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
                  ].join(" ")}
                >
                  <span className={[
                    "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                    active ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500",
                  ].join(" ")}>
                    <Icon size={17} />
                  </span>
                  <span className={["text-xs font-semibold leading-tight", active ? "text-green-700" : "text-gray-700"].join(" ")}>
                    {label}
                  </span>
                  <span className="text-[10px] leading-tight text-gray-400">{description}</span>
                </button>
              );
            })}
          </div>
          {errors.userType && <p className="mt-1.5 text-xs text-red-500">{errors.userType.message}</p>}
        </div>

        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
            {selectedType === "sp" ? "Email" : "Phone number"}
          </label>
          {selectedType === "sp" ? (
            <input
              id="username"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              {...register("username")}
              className="w-full h-11 px-3.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
            />
          ) : (
            <div className="flex">
              <span className="inline-flex items-center px-3.5 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-sm text-gray-500 select-none">
                +234
              </span>
              <input
                id="username"
                type="tel"
                placeholder="8012345678"
                autoComplete="tel"
                {...register("username")}
                className="flex-1 h-11 px-3.5 rounded-r-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
              />
            </div>
          )}
          {errors.username && <p className="mt-1.5 text-xs text-red-500">{errors.username.message}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
            <Link href={ROUTES.PASSWORD_RECOVERY} className="text-xs text-green-600 hover:text-green-700 font-medium">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              {...register("password")}
              className="w-full h-11 px-3.5 pr-11 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          Sign In
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href={ROUTES.SIGN_UP} className="text-green-600 hover:text-green-700 font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
}
