"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useLogout } from "@/hooks/use-logout";
import { ERoles } from "@/types/global";
import { ROUTES } from "@/constants/routes";
import {
  LayoutDashboard,
  Thermometer,
  History,
  BarChart3,
  ShoppingBag,
  TrendingUp,
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
  const isActive =
    pathname === item.href ||
    (item.href !== ROUTES.MARKETPLACE && pathname.startsWith(item.href + "/"));

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 select-none",
        collapsed ? "justify-center px-0 py-3" : "px-3.5 py-2.5",
        isActive
          ? "bg-green-500/15 text-green-400"
          : "text-gray-400 hover:bg-white/5 hover:text-gray-100"
      )}
    >
      {isActive && !collapsed && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-green-500 rounded-r-full" />
      )}
      <item.icon size={19} className="shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge != null && item.badge > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full text-[11px] font-semibold bg-red-500/20 text-red-400">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

function SectionGroup({
  section,
  collapsed,
}: {
  section: NavSection;
  collapsed: boolean;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="space-y-0.5">
      {!collapsed && (
        section.collapsible ? (
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 w-full text-[10px] font-bold text-gray-600 uppercase tracking-widest px-3.5 mb-1 hover:text-gray-400 transition-colors"
          >
            <span className="flex-1 text-left">{section.label}</span>
            {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
        ) : (
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-3.5 mb-1">
            {section.label}
          </p>
        )
      )}
      {(!section.collapsible || open || collapsed) && (
        <div className="space-y-0.5">
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
  const { user } = useAuthStore();
  const role = user?.role;
  const { t } = useTranslation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const logout = useLogout();

  const isServiceProvider = role === ERoles.SERVICE_PROVIDER;
  const isOperator = role === ERoles.OPERATOR;
  const isCoolingUser = role === ERoles.COOLING_USER;
  const isFarmer = role === ERoles.FARMER;
  const isEndUser = isCoolingUser || isFarmer;

  // ── Nav sections ──────────────────────────────────────────────────────────

  const sections: NavSection[] = [];

  const mainItems: NavItem[] = [
    { label: t("dashboard"), href: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: t("coolingUnits"), href: ROUTES.COOLING_UNITS, icon: Thermometer },
    { label: t("history"), href: ROUTES.HISTORY, icon: History },
  ];
  if (!isEndUser) {
    mainItems.push({ label: t("analytics"), href: ROUTES.ANALYTICS, icon: BarChart3 });
  }
  mainItems.push({ label: t("marketPrice"), href: ROUTES.MARKET_PRICE, icon: TrendingUp });
  sections.push({ label: "Main", items: mainItems });

  const marketplaceItems: NavItem[] = [
    { label: "Browse", href: ROUTES.MARKETPLACE, icon: ShoppingBag },
  ];
  if (isServiceProvider || isOperator) {
    marketplaceItems.push(
      { label: "Cart", href: ROUTES.MARKETPLACE_CART, icon: ShoppingCart },
      { label: "My Orders", href: ROUTES.MARKETPLACE_ORDERS, icon: Package },
    );
  }
  marketplaceItems.push({ label: "Sales", href: ROUTES.MARKETPLACE_SALES, icon: TrendingUp });
  if (isServiceProvider || isOperator) {
    marketplaceItems.push({ label: "Company Orders", href: ROUTES.MARKETPLACE_COMPANY_ORDERS, icon: Building2 });
  }
  sections.push({ label: "Marketplace", items: marketplaceItems });

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

  const accountItems: NavItem[] = [
    { label: t("profile"), href: ROUTES.ACCOUNT_PROFILE, icon: User },
    { label: t("bankDetails"), href: ROUTES.ACCOUNT_BANK_DETAILS, icon: CreditCard },
  ];
  if (isServiceProvider || isOperator) {
    accountItems.push({ label: t("coupons"), href: ROUTES.ACCOUNT_COUPONS, icon: Tag });
  }
  if (isServiceProvider) {
    accountItems.push({ label: "Farmer Bank Accounts", href: ROUTES.ACCOUNT_FARMER_BANK_ACCOUNTS, icon: Landmark });
  }
  if (isServiceProvider || isOperator) {
    accountItems.push({ label: "Marketplace Setup", href: ROUTES.ACCOUNT_MARKETPLACE_SETUP, icon: Store });
  }
  sections.push({ label: t("account"), items: accountItems });

  sections.push({
    label: "Help",
    items: [
      { label: t("notifications"), href: ROUTES.NOTIFICATIONS, icon: Bell, badge: unreadCount },
      { label: t("faq"), href: ROUTES.FAQ, icon: HelpCircle },
    ],
  });

  const fullName = user ? `${user.firstName} ${user.lastName}` : "User";
  const roleLabel = role ? role.replace(/_/g, " ") : "";
  const initials = getInitials(fullName);

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-gray-950 border-r border-white/5 transition-all duration-300 overflow-hidden shrink-0",
        collapsed ? "w-[60px]" : "w-60"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 border-b border-white/5 shrink-0",
          collapsed ? "justify-center px-0 py-4" : "px-4 py-4"
        )}
      >
        <div className="shrink-0 w-8 h-8 rounded-xl bg-green-950/80 ring-1 ring-green-800/50 flex items-center justify-center">
          <Image
            src="/agricool_logo.png"
            alt="Agricool"
            width={22}
            height={22}
            className="object-contain"
          />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-bold text-sm text-white tracking-tight leading-none">Agricool</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Agrisens</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-4 [&::-webkit-scrollbar]:w-0">
        {sections.map((section) => (
          <SectionGroup key={section.label} section={section} collapsed={collapsed} />
        ))}
      </nav>

      {/* User + logout */}
      <div className="shrink-0 border-t border-white/5 px-2 py-2 space-y-0.5">
        <div
          className={cn(
            "flex items-center gap-2.5 px-2 py-2 rounded-lg",
            collapsed && "justify-center"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-green-900/60 ring-1 ring-green-800/40 flex items-center justify-center shrink-0 text-green-400 text-xs font-bold">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-gray-200 truncate leading-none mb-0.5">
                {fullName}
              </p>
              <p className="text-[11px] text-gray-500 truncate capitalize">
                {roleLabel.toLowerCase()}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowLogoutConfirm(true)}
          title={collapsed ? t("logout") : undefined}
          className={cn(
            "flex items-center gap-3 w-full rounded-lg text-sm font-medium text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors",
            collapsed ? "justify-center px-0 py-3" : "px-3.5 py-2.5"
          )}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>{t("logout")}</span>}
        </button>
      </div>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <LogOut size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Log out?</h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  You&apos;ll need to sign in again to access your account.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={logout}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-sm font-medium text-white transition-all"
              >
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
