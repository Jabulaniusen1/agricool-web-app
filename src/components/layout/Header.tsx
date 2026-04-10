"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, Menu, Moon, Sun, Globe, ChevronDown, LogOut, User, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import "@/i18n";

import { useAuthStore } from "@/stores/auth";
import { ERoles } from "@/types/global";
import { useLogout } from "@/hooks/use-logout";
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

// ── Lightweight custom dropdown ──────────────────────────────────────────────

function Dropdown({
  trigger,
  children,
  align = "right",
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "right" | "left";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          className={[
            "absolute top-full mt-1.5 z-50 min-w-45",
            "bg-white dark:bg-gray-900",
            "border border-gray-200 dark:border-gray-700/80",
            "rounded-xl shadow-lg shadow-black/10 dark:shadow-black/40",
            "py-1 overflow-hidden",
            align === "right" ? "right-0" : "left-0",
          ].join(" ")}
          onClick={close}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownItem({
  onClick,
  children,
  danger,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors text-left",
        danger
          ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
          : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// ── Role badge ───────────────────────────────────────────────────────────────

const ROLE_META: Record<ERoles, { label: string; color: string }> = {
  [ERoles.AUTH]:             { label: "Unverified",        color: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700" },
  [ERoles.COOLING_USER]:     { label: "Cooling User",      color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800" },
  [ERoles.FARMER]:           { label: "Farmer",            color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800" },
  [ERoles.OPERATOR]:         { label: "Operator",          color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-800" },
  [ERoles.SERVICE_PROVIDER]: { label: "Service Provider",  color: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800" },
};

// ────────────────────────────────────────────────────────────────────────────

export function Header({
  onMenuToggle,
  title,
}: {
  onMenuToggle: () => void;
  title?: string;
}) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { i18n } = useTranslation();
  const { data: notifications } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const handleLogout = useLogout();

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;
  const fullName = user ? `${user.firstName} ${user.lastName}` : "User";
  const initials = getInitials(fullName);
  const currentLang = i18n.language.split("-")[0];

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
      <header className="relative z-60 h-14 shrink-0 flex items-center gap-2 px-3 md:px-4 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm">

        {/* Sidebar toggle */}
        <button
          onClick={onMenuToggle}
          aria-label="Toggle menu"
          className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <Menu size={20} />
        </button>

        {title && (
          <h1 className="font-semibold text-base text-gray-800 dark:text-gray-100 hidden md:block ml-0.5 truncate">
            {title}
          </h1>
        )}

        <div className="flex-1" />

        {/* Language picker */}
        <Dropdown
          trigger={
            <button className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              <Globe size={16} />
              <span className="hidden sm:inline text-xs font-semibold uppercase">
                {currentLang}
              </span>
            </button>
          }
        >
          {LANGUAGES.map((l) => (
            <DropdownItem key={l.value} onClick={() => handleLanguageChange(l.value)}>
              {currentLang === l.value ? (
                <Check size={13} className="text-green-600 shrink-0" />
              ) : (
                <span className="w-3.25 shrink-0" />
              )}
              <span className={currentLang === l.value ? "font-semibold text-green-600" : ""}>
                {l.label}
              </span>
            </DropdownItem>
          ))}
        </Dropdown>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(true)}
            aria-label="Notifications"
            className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <Bell size={17} />
          </button>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center pointer-events-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>

        {/* User menu */}
        <Dropdown
          trigger={
            <button className="flex items-center gap-2 h-9 pl-1.5 pr-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                {initials}
              </div>
              <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-200 max-w-28 truncate">
                {user?.firstName}
              </span>
              <ChevronDown size={13} className="hidden md:block text-gray-400" />
            </button>
          }
        >
          {/* User info header */}
          <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-700/60">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {fullName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {user?.email || user?.phone}
            </p>
            {(() => {
              const meta = user?.role ? ROLE_META[user.role] : null;
              return (
                <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${meta ? meta.color : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700"}`}>
                  {meta ? meta.label : "No role"}
                </span>
              );
            })()}
          </div>

          <div className="py-1">
            <DropdownItem onClick={() => router.push(ROUTES.ACCOUNT_PROFILE)}>
              <User size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
              {i18n.t("profile")}
            </DropdownItem>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700/60 py-1">
            <DropdownItem onClick={handleLogout} danger>
              <LogOut size={14} className="shrink-0" />
              {i18n.t("logout")}
            </DropdownItem>
          </div>
        </Dropdown>
      </header>

      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
