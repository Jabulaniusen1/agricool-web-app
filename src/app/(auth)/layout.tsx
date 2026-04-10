import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

const FEATURES = [
  "Real-time temperature monitoring",
  "Produce freshness tracking",
  "Market price predictions",
  "Digital twin simulations",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Branding panel — desktop only */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] shrink-0 bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 flex-col justify-between p-10 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-black/10 rounded-full" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Image src="/agricool_logo.png" alt="Agricool" width={28} height={28} className="object-contain" />
          </div>
          <div>
            <span className="text-white font-bold text-base leading-none block">Agricool</span>
            <span className="text-green-200/60 text-[11px]">Agrisens</span>
          </div>
        </div>

        <div className="relative z-10 space-y-7">
          <div>
            <h2 className="text-white font-extrabold text-[2rem] leading-tight mb-3">
              Smart Cold Chain<br />Management
            </h2>
            <p className="text-green-100/75 text-sm leading-relaxed">
              Monitor cooling units, track produce freshness, and access market
              insights — all in one place.
            </p>
          </div>
          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-green-100/90">
                <CheckCircle2 size={15} className="text-green-300 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-green-100/40 text-xs">© 2025 Agricool · Agrisens</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 lg:p-10 overflow-y-auto">
        <div className="w-full max-w-md py-8">{children}</div>
      </div>
    </div>
  );
}
