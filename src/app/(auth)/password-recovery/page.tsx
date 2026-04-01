"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { passwordRecoverySchema, PasswordRecoveryFormValues } from "@/constants/schemas";
import { authService } from "@/services/auth-service";
import { ROUTES } from "@/constants/routes";

export default function PasswordRecoveryPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordRecoveryFormValues>({
    resolver: zodResolver(passwordRecoverySchema),
  });

  const onSubmit = async (values: PasswordRecoveryFormValues) => {
    try {
      await authService.requestResetPassword(values);
      setSent(true);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Request failed";
      toast.error(message);
    }
  };

  if (sent) {
    return (
      <Card className="shadow-xl border-0">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Mail className="text-green-600" size={24} />
            </div>
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a password reset link to your email address. Check your inbox and follow the instructions.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link href={ROUTES.SIGN_IN} className="text-green-600 hover:underline text-sm">
            ← Back to Sign In
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-0">
      <CardHeader>
        <CardTitle className="text-xl">Forgot Password</CardTitle>
        <CardDescription>Enter your email to receive a password reset link</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <Link href={ROUTES.SIGN_IN} className="text-green-600 hover:underline">
            ← Back to Sign In
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
