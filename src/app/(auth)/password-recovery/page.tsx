"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { passwordRecoverySchema, PasswordRecoveryFormValues } from "@/constants/schemas";
import { authService } from "@/services/auth-service";
import { ROUTES } from "@/constants/routes";

export default function PasswordRecoveryPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordRecoveryFormValues>({ resolver: zodResolver(passwordRecoverySchema) });

  const onSubmit = async (values: PasswordRecoveryFormValues) => {
    try {
      await authService.requestResetPassword(values);
      setSent(true);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? "Request failed");
    }
  };

  if (sent) {
    return (
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-8 text-center">
        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MailCheck size={28} className="text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Check your email</h1>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          We&apos;ve sent a password reset link to your email address. Check your inbox and follow the instructions.
        </p>
        <Link
          href={ROUTES.SIGN_IN}
          className="inline-block mt-6 text-sm text-green-600 hover:text-green-700 font-medium"
        >
          ← Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-8">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-7">
        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
          <Image src="/agricool_logo.png" alt="Agricool" width={36} height={36} className="object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
        <p className="text-sm text-gray-500 mt-1">Enter your email to receive a reset link</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email")}
            className="w-full h-11 px-3.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          Send Reset Link
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
