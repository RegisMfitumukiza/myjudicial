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
  DollarSign,
  Bell,
  Settings,
  Shield,
  BarChart3,
  Calendar,
  CalendarDays,
  Video,
  MessageSquare,
  Briefcase,
  Star,
  Clock,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  LogOut,
  Key,
  Palette,
  ShieldCheck,
  FileCheck,
ClipboardList,
FolderOpen,
Scale,
ChevronsUpDown,
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
  labelKey: string;
}

interface NavGroup {
  groupKey: string;
  items: NavItem[];
}

const ROLE_NAVIGATION: Record<UserRole, NavGroup[]> = {
  [UserRole.ADMIN]: [
    {
      groupKey: "overview",
      items: [
        { href: "/admin/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
        { href: "/admin/dashboard/analytics", icon: BarChart3, labelKey: "analytics" },
      ],
    },
    {
      groupKey: "marketplace",
      items: [
        { href: "/admin/dashboard/experts", icon: BadgeCheck, labelKey: "experts" },
        { href: "/admin/dashboard/users", icon: Users, labelKey: "users" },
        { href: "/admin/dashboard/bookings", icon: Calendar, labelKey: "bookings" },
      ],
    },
    {
      groupKey: "trustSafety",
      items: [
        { href: "/admin/dashboard/verifications", icon: FileCheck, labelKey: "verifications" },
        { href: "/admin/dashboard/reviews", icon: Star, labelKey: "reviews" },
        { href: "/admin/dashboard/compliance", icon: Shield, labelKey: "compliance" },
      ],
    },
    {
      groupKey: "finance",
      items: [
        { href: "/admin/dashboard/finance", icon: DollarSign, labelKey: "finance" },
      ],
    },
    {
      groupKey: "operations",
      items: [
        { href: "/admin/dashboard/notifications?tab=inbox", icon: Bell, labelKey: "notifications" },
        { href: "/admin/dashboard/documents", icon: FolderOpen, labelKey: "documents" },
        { href: "/admin/dashboard/audit-logs", icon: ClipboardList, labelKey: "auditLogs" },
        { href: "/admin/dashboard/messages", icon: MessageSquare, labelKey: "messages" },
      ],
    },
    {
      groupKey: "configuration",
      items: [
        { href: "/admin/dashboard/specialties", icon: Scale, labelKey: "practiceAreas" },
        { href: "/admin/dashboard/settings", icon: Settings, labelKey: "settings" },
      ],
    },
  ],
  [UserRole.EXPERT]: [
    {
      groupKey: "overview",
      items: [
        { href: "/expert/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
        { href: "/expert/dashboard/earnings", icon: DollarSign, labelKey: "earnings" },
      ],
    },
    {
      groupKey: "business",
      items: [
        { href: "/expert/dashboard/bookings", icon: Calendar, labelKey: "bookings" },
        { href: "/expert/dashboard/consultations", icon: Video, labelKey: "consultations" },
        { href: "/expert/dashboard/calendar", icon: CalendarDays, labelKey: "calendar" },
        { href: "/expert/dashboard/availability", icon: Clock, labelKey: "availability" },
        { href: "/expert/dashboard/availability-overrides", icon: CalendarDays, labelKey: "dateOverrides" },
        { href: "/expert/dashboard/schedule-settings", icon: Settings, labelKey: "scheduleSettings" },
        { href: "/expert/dashboard/services", icon: Briefcase, labelKey: "services" },
      ],
    },
    {
      groupKey: "engagement",
      items: [
        { href: "/expert/dashboard/reviews", icon: Star, labelKey: "reviews" },
        { href: "/expert/dashboard/messages", icon: MessageSquare, labelKey: "messages" },
      ],
    },
    {
      groupKey: "account",
      items: [
        { href: "/expert/dashboard/setup", icon: ShieldCheck, labelKey: "setup" },
        { href: "/expert/dashboard/verification", icon: BadgeCheck, labelKey: "verification" },
        { href: "/expert/dashboard/notifications", icon: Bell, labelKey: "notifications" },
      ],
    },
  ],
  [UserRole.CITIZEN]: [],
};

interface AppSidebarProps {
  user: PublicUser;
  pathname: string;
}

function getDashboardBase(role: UserRole): string {
  return `/${role.toLowerCase()}/dashboard`;
}

/* ─── Profile Dropdown (Desktop) ─── */
function ProfileDropdown({
  open,
  onClose,
  user,
  avatarUrl,
  isCollapsed = false,
}: {
  open: boolean;
  onClose: () => void;
  user: PublicUser;
  avatarUrl: string | null;
  isCollapsed?: boolean;
}) {
  const t = useTranslations("shared.sidebar");
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const navigate = useCallback((path: string) => {
    onClose();
    router.push(path);
  }, [onClose, router]);

  if (!open) return null;

  return (
    <>
      {/* ── Fixed backdrop for closing on click-outside on desktop ── */}
      <div
        className="fixed inset-0 z-40 bg-transparent"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Desktop Floating Popover ── */}
      <div
        className={`
          z-50 rounded-xl border border-border bg-popover text-popover-foreground p-1.5 shadow-xl backdrop-blur-md
          ${
            isCollapsed
              ? "absolute bottom-1 left-full ml-3 w-60"
              : "absolute bottom-full left-0 right-0 mb-2 w-full min-w-[230px]"
          }
        `}
        role="menu"
        aria-label="User account menu"
      >
        <div className="px-3 py-2.5 rounded-t-lg bg-muted/40 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <ExpertAvatar src={avatarUrl} name={user.firstName + " " + user.lastName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-[11px] text-muted-foreground" title={user.email}>
                {user.email}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-0.5 py-1">
          <button
            onClick={() => navigate(`${getDashboardBase(user.role)}/profile`)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            role="menuitem"
          >
            <User size={15} className="text-muted-foreground" />
            {t("profile")}
          </button>
          <button
            onClick={() => navigate(`${getDashboardBase(user.role)}/security`)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            role="menuitem"
          >
            <Key size={15} className="text-muted-foreground" />
            {t("security")}
          </button>
          <button
            onClick={() => navigate(`${getDashboardBase(user.role)}/profile#preferences`)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            role="menuitem"
          >
            <Palette size={15} className="text-muted-foreground" />
            {t("preferences")}
          </button>
        </div>

        <div className="my-1 border-t border-border/50" />

        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
          role="menuitem"
        >
          <LogOut size={15} />
          {t("signOut")}
        </button>
      </div>
    </>
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

  const isExpert = user.role === UserRole.EXPERT;
  const { data: expertPhotoUrl } = useExpertPhotoUrl({ enabled: isExpert });
  const avatarUrl = isExpert ? (expertPhotoUrl ?? null) : (user.avatarUrl ?? null);

  const navGroups = ROLE_NAVIGATION[user.role] || [];
  const base = getDashboardBase(user.role);

  const isActive = useCallback(
    (href: string) => {
      const cleanHref = href.split("?")[0];
      if (cleanHref === "/admin/dashboard" || cleanHref === "/expert/dashboard") {
        return pathname === cleanHref;
      }
      return pathname === cleanHref || pathname.startsWith(cleanHref + "/");
    },
    [pathname],
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed((c) => !c);
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
      {/* ─── Mobile top header bar: [Menu + Logo] on Left, [Notifications Bell] on Right ─── */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-border/40 bg-background/95 backdrop-blur px-3 sm:px-4 lg:hidden min-w-0 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground shrink-0"
            aria-label={t("openNavigationMenu")}
          >
            <Menu size={20} />
          </button>
          <Logo fontSize="text-base" href={base} className="min-w-0" hideTextOnSmall />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href={user.role === UserRole.ADMIN ? "/admin/dashboard/notifications" : "/expert/dashboard/notifications"}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t("notifications")}
            title={t("notifications")}
          >
            <Bell size={19} />
            {notifUnreadCount > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            )}
          </Link>
        </div>
      </header>

      {/* ─── Mobile backdrop ─── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] lg:hidden transition-opacity duration-200"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`
          flex flex-col bg-card border-r border-border/50
          transition-[width,transform] duration-250 ease-out
          fixed inset-y-0 left-0 z-50
          w-[min(280px,calc(100vw-36px))] overflow-hidden
          ${mobileOpen ? "translate-x-0 visible pointer-events-auto shadow-2xl" : "-translate-x-full invisible pointer-events-none"}
          lg:static lg:translate-x-0 lg:z-auto lg:flex-shrink-0 lg:visible lg:pointer-events-auto lg:shadow-none
          ${collapsed ? "lg:w-[68px]" : "lg:w-64"}
        `}
        role="navigation"
        aria-label="Sidebar navigation"
      >
        {/* ─── Header: Logo + Single Collapse Toggle ─── */}
        <div className="flex h-16 shrink-0 items-center border-b border-border/40 px-3.5">
          {/* Mobile drawer header (always expanded with close button) */}
          <div className="flex w-full items-center justify-between lg:hidden min-w-0 gap-2">
            <div className="flex items-center min-w-0 overflow-hidden">
              <Logo fontSize="text-base" href={base} className="min-w-0" hideTextOnSmall />
            </div>
            <button
              onClick={closeMobile}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground shrink-0"
              aria-label={t("closeNavigationMenu")}
            >
              <X size={18} />
            </button>
          </div>

          {/* Desktop header: switches between expanded (Logo + Toggle) and collapsed (Centered Logo) */}
          <div className="hidden lg:flex w-full items-center">
            {collapsed ? (
              <div className="flex w-full items-center justify-center">
                <button
                  onClick={() => setCollapsed(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title={`${t("expandSidebar")} (Ctrl+B)`}
                  aria-label={t("expandSidebar")}
                >
                  <Logo iconOnly iconSize={20} href={base} />
                </button>
              </div>
            ) : (
              <div className="flex w-full items-center justify-between min-w-0 gap-2">
                <Logo fontSize="text-base" href={base} className="min-w-0" />
                <button
                  onClick={() => setCollapsed(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground shrink-0"
                  title={`${t("collapseSidebar")} (Ctrl+B)`}
                  aria-label={t("collapseSidebar")}
                >
                  <PanelLeftClose size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ─── Navigation ─── */}
        <nav
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-2.5 px-2 sm:px-2.5 scrollbar-none"
          aria-label="Main navigation"
        >
          {navGroups.map(({ groupKey, items }, groupIdx) => (
            <div key={groupKey} className={groupIdx > 0 ? "mt-3 pt-2.5 border-t border-border/30" : ""}>
              {!collapsed && (
                <p className="mb-1 px-2 sm:px-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 select-none">
                  {t(groupKey as any)}
                </p>
              )}
              {collapsed && groupIdx > 0 && (
                <div className="mx-auto my-1.5 w-5 border-t border-border/40" />
              )}
              <div className="space-y-0.5" role="list">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const itemLabel = t(item.labelKey as any);
                  const isMessages = item.href.includes("/messages");
                  const isNotifications = item.href.includes("/notifications");

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobile}
                      title={collapsed ? itemLabel : undefined}
                      aria-current={active ? "page" : undefined}
                      role="listitem"
                      className={`
                        group relative flex items-center rounded-lg text-xs font-medium transition-all duration-150
                        ${collapsed ? "h-9 w-9 mx-auto justify-center" : "min-h-9 py-1.5 px-2 sm:px-2.5 gap-2 sm:gap-2.5 w-full"}
                        ${
                          active
                            ? "bg-accent/80 font-semibold text-accent-foreground dark:bg-white/[0.08] dark:text-white"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground dark:hover:bg-white/[0.04]"
                        }
                      `}
                    >
                      {/* Active indicator pip */}
                      {active && (
                        <span
                          className={`absolute left-0 top-1 bottom-1 w-1 rounded-r-full bg-primary ${
                            collapsed ? "hidden" : ""
                          }`}
                        />
                      )}
                      {/* Icon with notification dot indicator */}
                      <div className="relative shrink-0">
                        <Icon
                          size={17}
                          className={`transition-colors ${
                            active
                              ? "text-primary dark:text-white"
                              : "text-muted-foreground/75 group-hover:text-foreground"
                          }`}
                        />
                        {/* Dot indicator when collapsed */}
                        {collapsed && (
                          (isMessages && chatUnreadCount > 0) ||
                          (isNotifications && notifUnreadCount > 0)
                        ) && (
                          <span
                            className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500 ring-2 ring-card"
                            aria-hidden="true"
                          />
                        )}
                      </div>

                      {/* Navigation label — full wrap on narrow screens without unfinished ellipsis truncation */}
                      {!collapsed && (
                        <span className="flex-1 min-w-0 text-xs font-medium leading-snug break-words">
                          {itemLabel}
                        </span>
                      )}

                      {/* Unread count badges when expanded */}
                      {!collapsed && isMessages && chatUnreadCount > 0 && (
                        <span className="ml-auto flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white dark:bg-blue-500 px-1.5 text-[10px] font-bold shadow-xs">
                          {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                        </span>
                      )}
                      {!collapsed && isNotifications && notifUnreadCount > 0 && (
                        <span className="ml-auto flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white dark:bg-blue-500 px-1.5 text-[10px] font-bold shadow-xs">
                          {notifUnreadCount > 99 ? "99+" : notifUnreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ─── Footer: Profile & Theme Toggle ─── */}
        <footer className="shrink-0 border-t border-border/40">
          {collapsed ? (
            /* ── Collapsed desktop footer ── */
            <div className="flex flex-col items-center gap-2 py-2.5 px-2">
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((p) => !p)}
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-85"
                  aria-label="Open profile menu"
                  title={`${user.firstName} ${user.lastName}`}
                >
                  <ExpertAvatar src={avatarUrl} name={user.firstName + " " + user.lastName} size="sm" />
                </button>
                <ProfileDropdown
                  open={profileOpen}
                  onClose={() => setProfileOpen(false)}
                  user={user}
                  avatarUrl={avatarUrl}
                  isCollapsed
                />
              </div>
              <ThemeToggle variant="header" className="h-8 w-8 text-muted-foreground hover:text-foreground" />
              <button
                onClick={() => setCollapsed(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title={`${t("expandSidebar")} (Ctrl+B)`}
                aria-label={t("expandSidebar")}
              >
                <PanelLeftOpen size={17} />
              </button>
            </div>
          ) : (
            /* ── Expanded footer (Desktop vs Mobile Drawer) ── */
            <div className="p-2">
              {/* Desktop Profile Button + Dropdown Popover */}
              <div className="hidden lg:flex items-center gap-1">
                <div className="relative flex-1 min-w-0">
                  <button
                    onClick={() => setProfileOpen((p) => !p)}
                    className="group flex w-full items-center justify-between gap-2 rounded-lg p-1.5 transition-colors hover:bg-muted/70 text-left min-w-0"
                    aria-expanded={profileOpen}
                    aria-haspopup="true"
                    title={`${user.firstName} ${user.lastName} • ${user.email}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <ExpertAvatar src={avatarUrl} name={user.firstName + " " + user.lastName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-foreground leading-tight">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="truncate text-[10px] font-medium text-muted-foreground/80 capitalize leading-tight">
                          {user.role.toLowerCase()}
                        </p>
                      </div>
                    </div>
                    <ChevronsUpDown size={14} className="text-muted-foreground/50 transition-colors group-hover:text-foreground shrink-0" />
                  </button>
                  <ProfileDropdown
                    open={profileOpen}
                    onClose={() => setProfileOpen(false)}
                    user={user}
                    avatarUrl={avatarUrl}
                    isCollapsed={false}
                  />
                </div>
                <div className="flex items-center shrink-0">
                  <ThemeToggle variant="header" className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" />
                </div>
              </div>

              {/* Mobile Drawer Integrated Profile Section (Zero popups!) */}
              <div className="lg:hidden space-y-1.5">
                {/* User Identity Card */}
                <div className="rounded-xl bg-muted/40 p-2 border border-border/40 min-w-0">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <ExpertAvatar src={avatarUrl} name={user.firstName + " " + user.lastName} size="sm" className="shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground leading-snug break-words">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-tight break-all select-all" title={user.email}>
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <ThemeToggle variant="header" className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0 rounded-lg hover:bg-muted" />
                  </div>
                </div>

                {/* Responsive Action Tiles — 2x2 grid matching desktop popover */}
                <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-border/30">
                  <Link
                    href={`${base}/profile`}
                    onClick={closeMobile}
                    className="flex items-center justify-start gap-2 rounded-lg py-2 px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <User size={15} className="shrink-0" />
                    <span className="truncate leading-tight">{t("profile")}</span>
                  </Link>

                  <Link
                    href={`${base}/security`}
                    onClick={closeMobile}
                    className="flex items-center justify-start gap-2 rounded-lg py-2 px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Key size={15} className="shrink-0" />
                    <span className="truncate leading-tight">{t("security")}</span>
                  </Link>

                  <Link
                    href={`${base}/profile#preferences`}
                    onClick={closeMobile}
                    className="flex items-center justify-start gap-2 rounded-lg py-2 px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Palette size={15} className="shrink-0" />
                    <span className="truncate leading-tight">{t("preferences")}</span>
                  </Link>

                  <button
                    onClick={async () => {
                      closeMobile();
                      await signOut({ callbackUrl: "/" });
                    }}
                    className="flex items-center justify-start gap-2 rounded-lg py-2 px-2.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut size={15} className="shrink-0" />
                    <span className="truncate leading-tight">{t("signOut")}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </footer>
      </aside>
    </>
  );
}
