"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AbilityProvider } from "@/lib/ability-context";
import { useAuthStore } from "@/stores/auth";
import { useNotifications } from "@/hooks/use-notifications";
import { ROUTES } from "@/constants/routes";
import { useTranslation } from "react-i18next";
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

  if (!isAuthenticated) return null;

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;
  const titleKey = PAGE_TITLE_KEYS[pathname];
  const title = titleKey ? t(titleKey) : "Agricool";

  return (
    <AbilityProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex">
          <Sidebar collapsed={sidebarCollapsed} unreadCount={unreadCount} />
        </div>

        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative z-10">
              <Sidebar collapsed={false} unreadCount={unreadCount} />
            </div>
          </div>
        )}

        {/* Main content */}
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
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </AbilityProvider>
  );
}
