"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Thermometer, ShoppingBag, User, MoreHorizontal } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AbilityProvider } from "@/lib/ability-context";
import { useAuthStore } from "@/stores/auth";
import { useNotifications } from "@/hooks/use-notifications";
import { ROUTES } from "@/constants/routes";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import "@/i18n";

const PAGE_TITLE_KEYS: Record<string, string> = {
  "/dashboard": "dashboard",
  "/cooling-units": "coolingUnits",
  "/history": "history",
  "/analytics": "analytics",
  "/marketplace": "marketplace",
  "/market-price": "marketPrice",
  "/account/profile": "profile",
  "/account/bank-details": "bankDetails",
  "/account/coupons": "coupons",
  "/notifications": "notifications",
  "/faq": "faq",
};

const BOTTOM_NAV = [
  { href: ROUTES.DASHBOARD, icon: LayoutDashboard, label: "Dashboard" },
  { href: ROUTES.COOLING_UNITS, icon: Thermometer, label: "Cooling" },
  { href: ROUTES.MARKETPLACE, icon: ShoppingBag, label: "Market" },
  { href: ROUTES.ACCOUNT_PROFILE, icon: User, label: "Account" },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { data: notifications } = useNotifications();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(ROUTES.SIGN_IN);
    }
  }, [isAuthenticated, router]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  if (!isAuthenticated) return null;

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;
  const titleKey = PAGE_TITLE_KEYS[pathname];
  const title = titleKey ? t(titleKey) : "Agricool";

  return (
    <AbilityProvider>
      <div className="flex h-screen overflow-hidden bg-background">

        {/* Desktop sidebar */}
        <div className="hidden lg:flex shrink-0">
          <Sidebar collapsed={sidebarCollapsed} unreadCount={unreadCount} />
        </div>

        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative z-10 shrink-0">
              <Sidebar collapsed={false} unreadCount={unreadCount} />
            </div>
          </div>
        )}

        {/* Main column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header
            title={title}
            onMenuToggle={() => {
              if (window.innerWidth < 1024) {
                setMobileSidebarOpen(!mobileSidebarOpen);
              } else {
                setSidebarCollapsed(!sidebarCollapsed);
              }
            }}
          />
          {/* Extra bottom padding on mobile so content isn't hidden behind bottom nav */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-[calc(4rem+1rem)] lg:pb-6">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 flex h-16">
        {BOTTOM_NAV.map(({ href, icon: Icon, label }) => {
          const isActive =
            pathname === href ||
            (href !== ROUTES.MARKETPLACE && pathname.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                isActive
                  ? "text-green-600 dark:text-green-500"
                  : "text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.25 : 1.75} />
              <span>{label}</span>
            </Link>
          );
        })}

        {/* More — opens full sidebar */}
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition-colors"
        >
          <MoreHorizontal size={22} strokeWidth={1.75} />
          <span>More</span>
        </button>
      </nav>
    </AbilityProvider>
  );
}
