"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { authService } from "@/services/auth-service";
import { ERoles } from "@/types/global";
import { ROUTES } from "@/constants/routes";
import {
  LayoutDashboard,
  Thermometer,
  History,
  BarChart3,
  ShoppingBag,
  TrendingUp,
  Settings,
  MapPin,
  Users,
  Building2,
  PieChart,
  User,
  CreditCard,
  Tag,
  Bell,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import "@/i18n";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: ERoles[];
  badge?: number;
};

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-green-500/10 text-green-400"
          : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
      )}
    >
      <item.icon size={18} className="shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge != null && item.badge > 0 && (
            <Badge className="h-5 min-w-5 text-xs px-1 bg-red-500/20 text-red-400 border-0">
              {item.badge > 99 ? "99+" : item.badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  );
}

export function Sidebar({
  collapsed,
  unreadCount = 0,
}: {
  collapsed: boolean;
  unreadCount?: number;
}) {
  const { user, tokens, revokeSession } = useAuthStore();
  const router = useRouter();
  const [managementOpen, setManagementOpen] = useState(true);
  const role = user?.role;
  const { t } = useTranslation();

  const isServiceProvider = role === ERoles.SERVICE_PROVIDER;
  const isOperator = role === ERoles.OPERATOR;
  const canManage = isServiceProvider || isOperator;

  const handleLogout = async () => {
    try {
      if (tokens?.refresh) {
        await authService.logout(tokens.refresh);
      }
    } catch {
      // ignore logout errors
    } finally {
      revokeSession();
      document.cookie = "agricool-auth=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      window.location.replace(ROUTES.SIGN_IN);
    }
  };

  const mainNav: NavItem[] = [
    { label: t("dashboard"), href: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: t("coolingUnits"), href: ROUTES.COOLING_UNITS, icon: Thermometer },
    { label: t("history"), href: ROUTES.HISTORY, icon: History },
    { label: t("analytics"), href: ROUTES.ANALYTICS, icon: BarChart3 },
    { label: t("marketplace"), href: ROUTES.MARKETPLACE, icon: ShoppingBag },
    { label: t("marketPrice"), href: ROUTES.MARKET_PRICE, icon: TrendingUp },
  ];

  const managementNav: NavItem[] = [
    { label: t("coolingUnits"), href: ROUTES.MANAGEMENT_COOLING_UNITS, icon: Thermometer },
    { label: t("locations"), href: ROUTES.MANAGEMENT_LOCATIONS, icon: MapPin },
    { label: t("users"), href: ROUTES.MANAGEMENT_USERS, icon: Users },
    { label: t("company"), href: ROUTES.MANAGEMENT_COMPANY, icon: Building2 },
    { label: t("analysis"), href: ROUTES.MANAGEMENT_ANALYSIS, icon: PieChart },
  ];

  const accountNav: NavItem[] = [
    { label: t("profile"), href: ROUTES.ACCOUNT_PROFILE, icon: User },
    { label: t("bankDetails"), href: ROUTES.ACCOUNT_BANK_DETAILS, icon: CreditCard },
    ...(isServiceProvider ? [{ label: t("coupons"), href: ROUTES.ACCOUNT_COUPONS, icon: Tag }] : []),
  ];

  const helpNav: NavItem[] = [
    { label: t("notifications"), href: ROUTES.NOTIFICATIONS, icon: Bell, badge: unreadCount },
    { label: t("faq"), href: ROUTES.FAQ, icon: HelpCircle },
  ];

  const fullName = user ? `${user.firstName} ${user.lastName}` : "User";
  const roleLabel = role ? role.replace(/_/g, " ") : "";

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-gray-950 border-r border-gray-800 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
        <Image
          src="/agricool_logo.png"
          alt="Agricool"
          width={collapsed ? 32 : 36}
          height={collapsed ? 32 : 36}
          className="shrink-0 object-contain"
        />
        {!collapsed && (
          <div>
            <span className="font-bold text-sm text-white">Agricool</span>
            <span className="text-[11px] text-gray-500 block">Agrisens</span>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-5">
        {/* Main */}
        <div className="space-y-1">
          {!collapsed && <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 mb-2">Main</p>}
          {mainNav.map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed} />
          ))}
        </div>

        {/* Management */}
        {canManage && (
          <div>
            {!collapsed && (
              <button
                onClick={() => setManagementOpen(!managementOpen)}
                className="flex items-center gap-2 w-full text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 mb-2 hover:text-gray-400 transition-colors"
              >
                <Settings size={12} />
                <span className="flex-1 text-left">Management</span>
                {managementOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
            )}
            {(managementOpen || collapsed) && (
              <div className="space-y-1">
                {managementNav.map((item) => (
                  <NavLink key={item.href} item={item} collapsed={collapsed} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Account */}
        <div className="space-y-1">
          {!collapsed && <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 mb-2">{t("account")}</p>}
          {accountNav.map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed} />
          ))}
        </div>

        {/* Help */}
        <div className="space-y-1">
          {!collapsed && <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 mb-2">Help</p>}
          {helpNav.map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      <div className="border-t border-gray-800" />

      {/* User info + logout */}
      <div className="px-2 py-3 space-y-1">
        <div className={cn("flex items-center gap-3 px-3 py-2 rounded-lg", collapsed && "justify-center")}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-green-900/60 text-green-400 text-xs font-bold">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{fullName}</p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {roleLabel.toLowerCase()}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut size={16} />
          {!collapsed && <span>{t("logout")}</span>}
        </button>
      </div>
    </aside>
  );
}
