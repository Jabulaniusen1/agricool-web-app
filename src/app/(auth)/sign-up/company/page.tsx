"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { signUpCompanySchema } from "@/constants/schemas";
import { authService } from "@/services/auth-service";
import { useAuthStore } from "@/stores/auth";
import { ROUTES } from "@/constants/routes";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "yo", label: "Yoruba" },
  { value: "ha", label: "Hausa" },
  { value: "ig", label: "Igbo" },
  { value: "pg", label: "Pidgin" },
];

const inputClass =
  "w-full h-11 px-3.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all";

export default function SignUpCompanyPage() {
  const router = useRouter();
  const { setSession } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signUpCompanySchema),
    defaultValues: { language: "en" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (values: any) => {
    try {
      const normalizedPhone =
        values.phone.startsWith("+") ? values.phone : `+234${values.phone.replace(/^0+/, "")}`;
      const res = await authService.signUpAsCompany({ ...values, phone: normalizedPhone });
      setSession({ access: res.access, refresh: res.refresh }, res.user);
      toast.success("Account created successfully!");
      router.replace(ROUTES.DASHBOARD);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? "Sign up failed");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
          <Image src="/agricool_logo.png" alt="Agricool" width={26} height={26} className="object-contain" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create Company Account</h1>
          <p className="text-xs text-gray-500">Set up your storage service or company account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
            <input id="firstName" placeholder="John" {...register("firstName")} className={inputClass} />
            {errors.firstName && <p className="mt-1.5 text-xs text-red-500">{String(errors.firstName.message)}</p>}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
            <input id="lastName" placeholder="Doe" {...register("lastName")} className={inputClass} />
            {errors.lastName && <p className="mt-1.5 text-xs text-red-500">{String(errors.lastName.message)}</p>}
          </div>
        </div>

        {/* Company */}
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
          <input id="companyName" placeholder="Your company" {...register("companyName")} className={inputClass} />
          {errors.companyName && <p className="mt-1.5 text-xs text-red-500">{String(errors.companyName.message)}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input id="email" type="email" placeholder="you@company.com" {...register("email")} className={inputClass} />
          {errors.email && <p className="mt-1.5 text-xs text-red-500">{String(errors.email.message)}</p>}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
          <div className="flex">
            <span className="inline-flex items-center px-3.5 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-sm text-gray-500 select-none">
              +234
            </span>
            <input
              id="phone"
              type="tel"
              placeholder="8012345678"
              autoComplete="tel"
              {...register("phone")}
              className="flex-1 h-11 px-3.5 rounded-r-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
            />
          </div>
          {errors.phone && <p className="mt-1.5 text-xs text-red-500">{String(errors.phone.message)}</p>}
        </div>

        {/* Language */}
        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1.5">Language</label>
          <select
            id="language"
            defaultValue="en"
            onChange={(e) => setValue("language", e.target.value)}
            className="w-full h-11 px-3.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all appearance-none cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
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
          {errors.password && <p className="mt-1.5 text-xs text-red-500">{String(errors.password.message)}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          Create Account
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        <Link href={ROUTES.SIGN_UP} className="text-green-600 hover:text-green-700 font-medium">
          ← Back to account type selection
        </Link>
      </p>
    </div>
  );
}
