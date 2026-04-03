"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Menu, Moon, Sun, Globe, ChevronDown, LogOut, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import "@/i18n";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuthStore } from "@/stores/auth";
import { authService } from "@/services/auth-service";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationDrawer } from "./NotificationDrawer";
import { getInitials } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { LANGUAGE_KEY } from "@/i18n";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "yo", label: "Yoruba" },
  { value: "ha", label: "Hausa" },
  { value: "ig", label: "Igbo" },
  { value: "pg", label: "Pidgin" },
];

export function Header({
  onMenuToggle,
  title,
}: {
  onMenuToggle: () => void;
  title?: string;
}) {
  const router = useRouter();
  const { user, tokens, revokeSession } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { i18n } = useTranslation();
  const { data: notifications } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;
  const fullName = user ? `${user.firstName} ${user.lastName}` : "User";

  const handleLogout = async () => {
    try {
      if (tokens?.refresh) await authService.logout(tokens.refresh);
    } catch {
      // ignore
    } finally {
      revokeSession();
      document.cookie = "agricool-auth=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      window.location.replace(ROUTES.SIGN_IN);
    }
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    const preferredLang = user?.language ?? localStorage.getItem(LANGUAGE_KEY) ?? "en";
    if (preferredLang && i18n.language !== preferredLang) {
      i18n.changeLanguage(preferredLang);
    }
    localStorage.setItem(LANGUAGE_KEY, preferredLang);
    document.documentElement.lang = preferredLang;
  }, [i18n, user?.language]);

  return (
    <>
      <header className="h-14 border-b bg-background/95 backdrop-blur-sm shadow-sm flex items-center gap-4 px-4 shrink-0">
        <Button variant="ghost" size="icon" onClick={onMenuToggle} className="lg:hidden">
          <Menu size={20} />
        </Button>

        {title && (
          <h1 className="font-semibold text-lg hidden md:block">{title}</h1>
        )}

        <div className="flex-1" />

        {/* Language selector */}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Globe size={16} />
            <span className="hidden sm:inline uppercase text-xs">
              {i18n.language.split("-")[0].toUpperCase()}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {LANGUAGES.map((l) => (
              <DropdownMenuItem
                key={l.value}
                onClick={() => handleLanguageChange(l.value)}
                className={i18n.language === l.value ? "font-medium text-green-600" : ""}
              >
                {l.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-muted-foreground"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </Button>

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotifOpen(true)}
            className="text-muted-foreground"
          >
            <Bell size={18} />
          </Button>
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-4 text-[10px] px-1 pointer-events-none"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted transition-colors">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-green-600 text-white text-xs font-bold">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:inline text-sm font-medium max-w-32 truncate">
              {user?.firstName}
            </span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="font-medium">{fullName}</div>
              <div className="text-xs text-muted-foreground font-normal">{user?.email || user?.phone}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(ROUTES.ACCOUNT_PROFILE)}>
              <User size={14} className="mr-2" />
              {i18n.t("profile")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut size={14} className="mr-2" />
              {i18n.t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
