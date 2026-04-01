"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { authService } from "@/services/auth-service";
import { coldtivateService } from "@/services/coldtivate-service";
import { useAuthStore } from "@/stores/auth";
import { OperatorInvite } from "@/types/global";
import { ROUTES } from "@/constants/routes";

type FormValues = {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  password: string;
};

function InviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [invite, setInvite] = useState<OperatorInvite | null>(null);
  const [inviteType, setInviteType] = useState<"operator" | "employee">("operator");
  const [loading, setLoading] = useState(true);

  const code = searchParams.get("code") ?? "";

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } =
    useForm<FormValues>();

  useEffect(() => {
    if (!code) {
      toast.error("Invalid invite link");
      setLoading(false);
      return;
    }

    coldtivateService
      .getOperatorInvite(code)
      .then((data) => {
        setInvite(data);
        setInviteType("operator");
        if (data.email) setValue("email", data.email);
        if (data.phone) setValue("phone", data.phone);
      })
      .catch(() => {
        // Try employee invite type
        setInviteType("employee");
      })
      .finally(() => setLoading(false));
  }, [code, setValue]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (inviteType === "operator") {
        await authService.signUpOperatorByInvite({
          ...values,
          phone: values.phone ?? "",
          inviteCode: code,
        });
      } else {
        await authService.signUpEmployeeByInvite({
          ...values,
          email: values.email ?? "",
          inviteCode: code,
        });
      }
      toast.success("Account created! Please sign in.");
      router.replace(ROUTES.SIGN_IN);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Registration failed";
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-xl border-0">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-0">
      <CardHeader>
        <CardTitle className="text-xl">Complete Registration</CardTitle>
        <CardDescription>
          You&apos;ve been invited to join Agricool as an {inviteType}.
          {invite?.coolingUnitId && ` Cooling Unit #${invite.coolingUnitId}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input placeholder="John" {...register("firstName", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input placeholder="Doe" {...register("lastName", { required: true })} />
            </div>
          </div>

          {inviteType === "operator" ? (
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input placeholder="+234..." {...register("phone")} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="you@example.com" {...register("email")} />
            </div>
          )}

          <div className="space-y-2">
            <Label>Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                {...register("password", { required: true, minLength: 8 })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Complete Registration
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading invite...</div>}>
      <InviteForm />
    </Suspense>
  );
}
