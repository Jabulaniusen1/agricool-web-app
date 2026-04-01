"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { authService } from "@/services/auth-service";
import { ERoles } from "@/types/global";
import { ROUTES } from "@/constants/routes";
import { toast } from "sonner";
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
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/utils";
import { useState } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: ERoles[];
  badge?: number;
};

type NavGroup = {
  title?: string;
  items: NavItem[];
  roles?: ERoles[];
};

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <item.icon size={18} className="shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge != null && item.badge > 0 && (
            <Badge variant="destructive" className="h-5 min-w-5 text-xs px-1">
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
      router.replace(ROUTES.SIGN_IN);
    }
  };

  const mainNav: NavItem[] = [
    { label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: "Cooling Units", href: ROUTES.COOLING_UNITS, icon: Thermometer },
    { label: "History", href: ROUTES.HISTORY, icon: History },
    { label: "Analytics", href: ROUTES.ANALYTICS, icon: BarChart3 },
    { label: "Marketplace", href: ROUTES.MARKETPLACE, icon: ShoppingBag },
    { label: "Market Price", href: ROUTES.MARKET_PRICE, icon: TrendingUp },
  ];

  const managementNav: NavItem[] = [
    { label: "Cooling Units", href: ROUTES.MANAGEMENT_COOLING_UNITS, icon: Thermometer },
    { label: "Locations", href: ROUTES.MANAGEMENT_LOCATIONS, icon: MapPin },
    { label: "Users", href: ROUTES.MANAGEMENT_USERS, icon: Users },
    { label: "Company", href: ROUTES.MANAGEMENT_COMPANY, icon: Building2 },
    { label: "Analysis", href: ROUTES.MANAGEMENT_ANALYSIS, icon: PieChart },
  ];

  const accountNav: NavItem[] = [
    { label: "Profile", href: ROUTES.ACCOUNT_PROFILE, icon: User },
    { label: "Bank Details", href: ROUTES.ACCOUNT_BANK_DETAILS, icon: CreditCard },
    ...(isServiceProvider ? [{ label: "Coupons", href: ROUTES.ACCOUNT_COUPONS, icon: Tag }] : []),
  ];

  const helpNav: NavItem[] = [
    { label: "Notifications", href: ROUTES.NOTIFICATIONS, icon: Bell, badge: unreadCount },
    { label: "FAQ", href: ROUTES.FAQ, icon: HelpCircle },
  ];

  const fullName = user ? `${user.firstName} ${user.lastName}` : "User";
  const roleLabel = role ? role.replace(/_/g, " ") : "";

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-card border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b">
        <Image
          src="/agricool_logo.png"
          alt="Agricool"
          width={collapsed ? 32 : 36}
          height={collapsed ? 32 : 36}
          className="shrink-0 object-contain"
        />
        {!collapsed && (
          <div>
            <span className="font-bold text-sm">Agricool</span>
            <span className="text-xs text-muted-foreground block">Coldtivate</span>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main */}
        <div className="space-y-1">
          {!collapsed && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Main</p>}
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
                className="flex items-center gap-2 w-full text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2 hover:text-foreground"
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
          {!collapsed && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Account</p>}
          {accountNav.map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed} />
          ))}
        </div>

        {/* Help */}
        <div className="space-y-1">
          {!collapsed && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Help</p>}
          {helpNav.map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      <Separator />

      {/* User info + logout */}
      <div className="px-3 py-4 space-y-2">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-green-100 text-green-700 text-xs font-bold">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fullName}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">
                {roleLabel.toLowerCase()}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut size={16} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
