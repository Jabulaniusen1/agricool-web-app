"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { passwordResetSchema, PasswordResetFormValues } from "@/constants/schemas";
import { authService } from "@/services/auth-service";
import { ROUTES } from "@/constants/routes";

const inputClass =
  "w-full h-11 px-3.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all";

function PasswordResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);

  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetFormValues>({ resolver: zodResolver(passwordResetSchema) });

  const onSubmit = async (values: PasswordResetFormValues) => {
    if (!uid || !token) {
      toast.error("Invalid reset link");
      return;
    }
    try {
      await authService.resetPassword({ uid, token, newPassword: values.newPassword });
      toast.success("Password reset successfully! Please sign in.");
      router.replace(ROUTES.SIGN_IN);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? "Reset failed");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-8">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-7">
        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
          <Image src="/agricool_logo.png" alt="Agricool" width={36} height={36} className="object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
        <p className="text-sm text-gray-500 mt-1">Enter your new password below</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
          <div className="relative">
            <input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              {...register("newPassword")}
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
          {errors.newPassword && <p className="mt-1.5 text-xs text-red-500">{errors.newPassword.message}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Repeat your password"
            {...register("confirmPassword")}
            className={inputClass}
          />
          {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          Reset Password
        </button>
      </form>

      <p className="mt-5 text-center text-sm">
        <Link href={ROUTES.SIGN_IN} className="text-green-600 hover:text-green-700 font-medium">
          ← Back to Sign In
        </Link>
      </p>
    </div>
  );
}

export default function PasswordResetPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400 text-sm">Loading…</div>}>
      <PasswordResetForm />
    </Suspense>
  );
}
