"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  ClipboardList,
  Cpu,
  Landmark,
  Store,
  ShoppingCart,
  Package,
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
  badge?: number;
};

type NavSection = {
  label: string;
  items: NavItem[];
  collapsible?: boolean;
};

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  // Exact match for root-level paths to avoid /marketplace matching /marketplace/cart
  const isActive =
    pathname === item.href ||
    (item.href !== ROUTES.MARKETPLACE && pathname.startsWith(item.href + "/"));

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

function NavSectionGroup({
  section,
  collapsed,
}: {
  section: NavSection;
  collapsed: boolean;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      {!collapsed && (
        section.collapsible ? (
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 w-full text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 mb-2 hover:text-gray-400 transition-colors"
          >
            <Settings size={12} />
            <span className="flex-1 text-left">{section.label}</span>
            {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 mb-2">
            {section.label}
          </p>
        )
      )}
      {(!section.collapsible || open || collapsed) && (
        <div className="space-y-1">
          {section.items.map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed} />
          ))}
        </div>
      )}
    </div>
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
  const role = user?.role;
  const { t } = useTranslation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isServiceProvider = role === ERoles.SERVICE_PROVIDER;
  const isOperator = role === ERoles.OPERATOR;
  const isCoolingUser = role === ERoles.COOLING_USER;
  const isFarmer = role === ERoles.FARMER;
  const isEndUser = isCoolingUser || isFarmer;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      if (tokens?.refresh) {
        await authService.logout(tokens.refresh);
      }
    } catch {
      // ignore
    } finally {
      revokeSession();
      document.cookie = "agricool-auth=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      window.location.replace(ROUTES.SIGN_IN);
    }
  };

  // ─── Build nav sections based on role ─────────────────────────────────────

  const sections: NavSection[] = [];

  // ── Main (all roles) ──────────────────────────────────────────────────────
  const mainItems: NavItem[] = [
    { label: t("dashboard"), href: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: t("coolingUnits"), href: ROUTES.COOLING_UNITS, icon: Thermometer },
    { label: t("history"), href: ROUTES.HISTORY, icon: History },
  ];

  // Analytics not shown for end users (cooling_user / farmer)
  if (!isEndUser) {
    mainItems.push({ label: t("analytics"), href: ROUTES.ANALYTICS, icon: BarChart3 });
  }

  mainItems.push({ label: t("marketPrice"), href: ROUTES.MARKET_PRICE, icon: TrendingUp });

  sections.push({ label: "Main", items: mainItems });

  // ── Marketplace ───────────────────────────────────────────────────────────
  const marketplaceItems: NavItem[] = [
    { label: "Browse", href: ROUTES.MARKETPLACE, icon: ShoppingBag },
  ];

  // Cart & orders only for service_provider and operator (buyers with full access)
  if (isServiceProvider || isOperator) {
    marketplaceItems.push(
      { label: "Cart", href: ROUTES.MARKETPLACE_CART, icon: ShoppingCart },
      { label: "My Orders", href: ROUTES.MARKETPLACE_ORDERS, icon: Package },
    );
  }

  // Sales (listing produce) — all roles can sell
  marketplaceItems.push({ label: "Sales", href: ROUTES.MARKETPLACE_SALES, icon: TrendingUp });

  // Company orders — service_provider and operator only
  if (isServiceProvider || isOperator) {
    marketplaceItems.push({ label: "Company Orders", href: ROUTES.MARKETPLACE_COMPANY_ORDERS, icon: Building2 });
  }

  sections.push({ label: "Marketplace", items: marketplaceItems });

  // ── Management (service_provider and operator only) ────────────────────────
  if (isServiceProvider) {
    sections.push({
      label: "Management",
      collapsible: true,
      items: [
        { label: t("coolingUnits"), href: ROUTES.MANAGEMENT_COOLING_UNITS, icon: Thermometer },
        { label: t("locations"), href: ROUTES.MANAGEMENT_LOCATIONS, icon: MapPin },
        { label: t("users"), href: ROUTES.MANAGEMENT_USERS, icon: Users },
        { label: t("company"), href: ROUTES.MANAGEMENT_COMPANY, icon: Building2 },
        { label: t("analysis"), href: ROUTES.MANAGEMENT_ANALYSIS, icon: PieChart },
        { label: "Farmer Surveys", href: ROUTES.MANAGEMENT_FARMER_SURVEYS, icon: ClipboardList },
        { label: "Sensors", href: ROUTES.MANAGEMENT_SENSORS, icon: Cpu },
      ],
    });
  } else if (isOperator) {
    // Operators see: Cooling Users (farmers), Analysis, Farmer Surveys
    sections.push({
      label: "Management",
      collapsible: true,
      items: [
        { label: "Cooling Users", href: ROUTES.MANAGEMENT_USERS, icon: Users },
        { label: t("analysis"), href: ROUTES.MANAGEMENT_ANALYSIS, icon: PieChart },
        { label: "Farmer Surveys", href: ROUTES.MANAGEMENT_FARMER_SURVEYS, icon: ClipboardList },
      ],
    });
  }

  // ── Account ───────────────────────────────────────────────────────────────
  const accountItems: NavItem[] = [
    { label: t("profile"), href: ROUTES.ACCOUNT_PROFILE, icon: User },
    { label: t("bankDetails"), href: ROUTES.ACCOUNT_BANK_DETAILS, icon: CreditCard },
  ];

  // Coupons: service_provider and operator
  if (isServiceProvider || isOperator) {
    accountItems.push({ label: t("coupons"), href: ROUTES.ACCOUNT_COUPONS, icon: Tag });
  }

  // Farmer bank accounts: service_provider only (company-level management)
  if (isServiceProvider) {
    accountItems.push({ label: "Farmer Bank Accounts", href: ROUTES.ACCOUNT_FARMER_BANK_ACCOUNTS, icon: Landmark });
  }

  // Marketplace setup: service_provider and operator
  if (isServiceProvider || isOperator) {
    accountItems.push({ label: "Marketplace Setup", href: ROUTES.ACCOUNT_MARKETPLACE_SETUP, icon: Store });
  }

  sections.push({ label: t("account"), items: accountItems });

  // ── Help ──────────────────────────────────────────────────────────────────
  sections.push({
    label: "Help",
    items: [
      { label: t("notifications"), href: ROUTES.NOTIFICATIONS, icon: Bell, badge: unreadCount },
      { label: t("faq"), href: ROUTES.FAQ, icon: HelpCircle },
    ],
  });

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
        {sections.map((section) => (
          <NavSectionGroup key={section.label} section={section} collapsed={collapsed} />
        ))}
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
          onClick={() => setShowLogoutConfirm(true)}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut size={16} />
          {!collapsed && <span>{t("logout")}</span>}
        </button>
      </div>

      {/* Logout confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 shrink-0">
                <LogOut size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Log out?</h3>
                <p className="text-sm text-gray-500">You will need to sign in again to access your account.</p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-medium text-white transition-colors disabled:opacity-75"
              >
                {loggingOut ? "Logging out..." : "Yes, log out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
