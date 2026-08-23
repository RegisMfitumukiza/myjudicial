"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { signOut } from "next-auth/react";
import { useExpertPhotoUrl } from "@/features/experts/hooks/useExpertProfile";
import { ExpertAvatar } from "@/shared/components/expert-avatar";
import {
  LayoutDashboard,
  Users,
  BadgeCheck,
  FileText,
  DollarSign,
  Bell,
  Settings,
  Shield,
  BarChart3,
  Calendar,
  CalendarDays,
  MessageSquare,
  Briefcase,
  Star,
  Clock,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Key,
  Palette,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/shared/components/logo";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { useGetChatConversationsUnreadCount, useGetNotificationsUnreadCount } from "@/api/generated";
import type { PublicUser } from "@/features/auth/types";
import { UserRole } from "@/features/auth/types";
import { useTranslations } from "next-intl";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const ROLE_NAVIGATION: Record<UserRole, NavGroup[]> = {
  [UserRole.ADMIN]: [
    {
      group: "Overview",
      items: [
        { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/admin/dashboard/analytics", icon: BarChart3, label: "Analytics" },
      ],
    },
    {
      group: "Management",
      items: [
        { href: "/admin/dashboard/users", icon: Users, label: "Users" },
        { href: "/admin/dashboard/experts", icon: BadgeCheck, label: "Experts" },
        { href: "/admin/dashboard/bookings", icon: Calendar, label: "Bookings" },
        { href: "/admin/dashboard/compliance", icon: Shield, label: "Compliance" },
      ],
    },
    {
      group: "Finance",
      items: [
        { href: "/admin/dashboard/finance", icon: DollarSign, label: "Finance" },
      ],
    },
    {
      group: "System",
      items: [
        { href: "/admin/dashboard/audit-logs", icon: FileText, label: "Audit Logs" },
        { href: "/admin/dashboard/messages", icon: MessageSquare, label: "Messages" },
        { href: "/admin/dashboard/notifications", icon: Bell, label: "Notifications" },
        { href: "/admin/dashboard/settings", icon: Settings, label: "Settings" },
      ],
    },
  ],
  [UserRole.EXPERT]: [
    {
      group: "Overview",
      items: [
        { href: "/expert/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/expert/dashboard/earnings", icon: DollarSign, label: "Earnings" },
      ],
    },
    {
      group: "Business",
      items: [
        { href: "/expert/dashboard/bookings", icon: Calendar, label: "Bookings" },
        { href: "/expert/dashboard/calendar", icon: CalendarDays, label: "Calendar" },
        { href: "/expert/dashboard/availability", icon: Clock, label: "Availability" },
        { href: "/expert/dashboard/availability-overrides", icon: CalendarDays, label: "Date Overrides" },
        { href: "/expert/dashboard/schedule-settings", icon: Settings, label: "Schedule Settings" },
        { href: "/expert/dashboard/services", icon: Briefcase, label: "Services" },
      ],
    },
    {
      group: "Engagement",
      items: [
        { href: "/expert/dashboard/reviews", icon: Star, label: "Reviews" },
        { href: "/expert/dashboard/messages", icon: MessageSquare, label: "Messages" },
      ],
    },
    {
      group: "Account",
      items: [
        { href: "/expert/dashboard/setup", icon: ShieldCheck, label: "Setup" },
        { href: "/expert/dashboard/verification", icon: BadgeCheck, label: "Verification" },
        { href: "/expert/dashboard/profile", icon: Settings, label: "Profile" },
        { href: "/expert/dashboard/notifications", icon: Bell, label: "Notifications" },
      ],
    },
  ],
  [UserRole.CITIZEN]: [],
};



interface AppSidebarProps {
  user: PublicUser;
  pathname: string;
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}



function getDashboardBase(role: UserRole): string {
  return `/${role.toLowerCase()}/dashboard`;
}

/* ─── Profile Dropdown ─── */
function ProfileDropdown({
  open,
  onClose,
  user,
  avatarUrl,
}: {
  open: boolean;
  onClose: () => void;
  user: PublicUser;
  avatarUrl: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick, true);
    return () => document.removeEventListener("mousedown", handleClick, true);
  }, [open, onClose]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const navigateToProfile = useCallback((hash?: string) => {
    onClose();
    const base = getDashboardBase(user.role);
    
    // Admin uses /account for settings, others use /profile
    const route = user.role === UserRole.ADMIN ? `${base}/account` : `${base}/profile`;
    const url = hash ? `${route}#${hash}` : route;
    
    // Check if already on the page
    if (window.location.pathname === route) {
      // Already on page, just update hash directly
      window.location.hash = hash || '';
      // Dispatch hashchange event so the page detects it
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } else {
      // Navigate to page
      router.push(url);
    }
  }, [onClose, user.role, router]);

  if (!open) return null;

  const base = getDashboardBase(user.role);

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 right-0 z-50 mb-2 rounded-xl border border-brand-border/20 bg-white p-2 shadow-lg dark:border-gray-800 dark:bg-gray-900"
      role="menu"
    >
        <div className="px-3 py-2">
          <div className="flex items-center gap-3">
            <ExpertAvatar src={avatarUrl} name={user.firstName + " " + user.lastName} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-brand-border/10 dark:border-gray-800" />

        <div className="py-1">
          <button
            onClick={() => navigateToProfile()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            role="menuitem"
          >
            <User size={16} className="text-gray-400" />
            {user.role === UserRole.ADMIN ? "Account" : "Profile"}
          </button>
          <button
            onClick={() => navigateToProfile('account')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            role="menuitem"
          >
            <Key size={16} className="text-gray-400" />
            {user.role === UserRole.ADMIN ? "Security" : "Account"}
          </button>
          <button
            onClick={() => navigateToProfile('preferences')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            role="menuitem"
          >
            <Palette size={16} className="text-gray-400" />
            Preferences
          </button>
        </div>

        <div className="border-t border-brand-border/10 dark:border-gray-800" />

        <button
          onClick={handleSignOut}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
          role="menuitem"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
  );
}

export function AppSidebar({ user, pathname }: AppSidebarProps) {
  const t = useTranslations("shared.sidebar");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const { data: unreadChatData } = useGetChatConversationsUnreadCount({
    query: { refetchInterval: 30_000 },
  });
  const chatUnreadCount = unreadChatData?.status === 200 ? unreadChatData.data.data.unreadCount : 0;

  const { data: unreadNotifData } = useGetNotificationsUnreadCount({
    query: { refetchInterval: 30_000 },
  });
  const notifUnreadCount = unreadNotifData?.status === 200 ? unreadNotifData.data.data.count : 0;

  // For experts, use the signed URL hook; for other roles, no photo URL needed here
  const { data: expertPhotoUrl } = useExpertPhotoUrl();
  const avatarUrl = user.role === UserRole.EXPERT ? (expertPhotoUrl ?? null) : null;

  const navGroups = ROLE_NAVIGATION[user.role] || [];
  const base = getDashboardBase(user.role);

  const isActive = useCallback(
    (href: string) => {
      if (href === "/admin/dashboard" || href === "/expert/dashboard") {
        return pathname === href;
      }
      return pathname === href || pathname.startsWith(href + "/");
    },
    [pathname],
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <>
      {/* ─── Mobile top header bar ─── */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-brand-border/20 bg-white px-4 dark:border-gray-800 dark:bg-gray-950 lg:hidden">
        <Logo fontSize="text-base" />
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* ─── Mobile backdrop ─── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`
          flex flex-col bg-white dark:bg-gray-950 border-r border-brand-border/20 dark:border-gray-800
          transition-[width,transform] duration-300 ease-in-out
          fixed inset-y-0 left-0 z-50
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:static lg:translate-x-0 lg:z-auto lg:flex-shrink-0
          ${collapsed ? "w-16" : "w-64"}
        `}
        role="navigation"
        aria-label="Sidebar navigation"
      >
        {/* ─── Header: Logo + collapse toggle ─── */}
        <div className="flex h-16 shrink-0 items-center border-b border-brand-border/20 dark:border-gray-800">
          {collapsed ? (
            <div className="flex w-full items-center justify-center">
              <Logo iconOnly iconSize={20} href={base} />
            </div>
          ) : (
            <div className="flex w-full items-center justify-between px-4">
              <Logo fontSize="text-base" href={base} />
              <button
                onClick={closeMobile}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
                aria-label="Close navigation menu"
              >
                <X size={20} />
              </button>
              <button
                onClick={() => setCollapsed((c) => !c)}
                className="hidden rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:flex"
                title="Collapse sidebar"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          )}
        </div>

        {/* ─── Navigation ─── */}
        <nav className="flex-1 overflow-y-auto py-4" aria-label="Main navigation">
          {navGroups.map(({ group, items }, groupIdx) => (
            <div key={group} className={groupIdx > 0 ? "mt-2" : ""}>
              {!collapsed && (
                <p className="mb-1.5 px-6 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500">
                  {group}
                </p>
              )}
              <div className="space-y-0.5 px-3" role="list">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobile}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? "page" : undefined}
                      role="listitem"
                      className={`
                        group relative flex items-center rounded-lg text-sm font-medium transition-all duration-150
                        ${collapsed ? "justify-center py-2.5" : "gap-3 px-3 py-2.5"}
                        ${
                          active
                            ? "bg-brand-dark text-white dark:bg-white dark:text-black"
                            : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        }
                      `}
                    >
                      {/* Active indicator bar */}
                      {active && (
                        <span
                          className={`absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-current opacity-60 ${
                            collapsed ? "hidden" : ""
                          }`}
                        />
                      )}
                      <Icon
                        size={20}
                        className={`shrink-0 ${
                          active ? "text-white dark:text-black" : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300"
                        }`}
                      />
                      {item.label === "Messages" && chatUnreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand-blue ring-2 ring-white dark:ring-gray-950" />
                      )}
                      {item.label === "Notifications" && notifUnreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand-blue ring-2 ring-white dark:ring-gray-950" />
                      )}
                      {!collapsed && (
                        <span className="flex-1 truncate">{item.label}</span>
                      )}
                      {!collapsed && item.label === "Messages" && chatUnreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-blue px-1.5 text-[10px] font-bold text-white">
                          {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                        </span>
                      )}
                      {!collapsed && item.label === "Notifications" && notifUnreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-blue px-1.5 text-[10px] font-bold text-white">
                          {notifUnreadCount > 99 ? "99+" : notifUnreadCount}
                        </span>
                      )}
                      {/* Tooltip for collapsed mode */}
                      {collapsed && (
                        <span className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm dark:bg-gray-100 dark:text-gray-900 group-hover:lg:block whitespace-nowrap">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ─── Footer: Avatar, Theme, Collapse ─── */}
        <footer className="shrink-0 border-t border-brand-border/20 dark:border-gray-800">
          {collapsed ? (
            /* ── Collapsed footer ── */
            <div className="flex flex-col items-center gap-2 py-3">
              <div className="relative">
                  <button
                    onClick={() => setProfileOpen((p) => !p)}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:opacity-80"
                    aria-label="Open profile menu"
                    title={user.firstName + " " + user.lastName}
                  >
                    <ExpertAvatar src={avatarUrl} name={user.firstName + " " + user.lastName} size="sm" />
                </button>
                <ProfileDropdown
                  open={profileOpen}
                  onClose={() => setProfileOpen(false)}
                  user={user}
                  avatarUrl={avatarUrl}
                />
              </div>
              <ThemeToggle />
              <button
                onClick={() => setCollapsed(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                title="Expand sidebar"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          ) : (
            /* ── Expanded footer ── */
            <div className="px-3 py-3">
              <div className="relative">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setProfileOpen((p) => !p)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1.5 pl-2 pr-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-expanded={profileOpen}
                    aria-haspopup="true"
                  >
                    <ExpertAvatar src={avatarUrl} name={user.firstName + " " + user.lastName} size="sm" />
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <button
                      onClick={() => setCollapsed(true)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                      title="Collapse sidebar"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  </div>
                </div>
                <ProfileDropdown
                  open={profileOpen}
                  onClose={() => setProfileOpen(false)}
                  user={user}
                  avatarUrl={avatarUrl}
                />
              </div>
            </div>
          )}
        </footer>
      </aside>
    </>
  );
}
