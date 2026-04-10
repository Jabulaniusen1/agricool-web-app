import Link from "next/link";
import Image from "next/image";
import { Building2, Tractor, ArrowRight } from "lucide-react";
import { ROUTES } from "@/constants/routes";

const ACCOUNT_TYPES = [
  {
    href: ROUTES.SIGN_UP_COMPANY,
    icon: Building2,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    title: "Company / Storage Service",
    description: "Manage cooling units, operators, and customers",
  },
  {
    href: ROUTES.SIGN_UP_COOLING_USER,
    icon: Tractor,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    title: "Farmer / Cooling User",
    description: "Store your produce and access the marketplace",
  },
];

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
          <Image src="/agricool_logo.png" alt="Agricool" width={36} height={36} className="object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create an Account</h1>
        <p className="text-sm text-gray-500 mt-1">Choose your account type to get started</p>
      </div>

      {/* Account type cards */}
      <div className="space-y-3">
        {ACCOUNT_TYPES.map(({ href, icon: Icon, iconBg, iconColor, title, description }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 bg-white rounded-2xl ring-1 ring-gray-200 p-5 hover:ring-green-400 hover:shadow-sm transition-all group"
          >
            <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
              <Icon size={20} className={iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-green-500 shrink-0 transition-colors" />
          </Link>
        ))}
      </div>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href={ROUTES.SIGN_IN} className="text-green-600 hover:text-green-700 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
