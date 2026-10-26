"use client";

import { useState, useEffect, useRef } from "react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { handleAppSignOut } from "@/lib/auth-signout";
import {
  Search,
  Calendar,
  MessageSquare,
  User,
  Menu,
  X,
  LogOut,
  Bell,
  Settings,
  LayoutDashboard,
  Star,
  Bookmark,
  Sparkles,
  FileText,
  CreditCard,
  Shield,
} from "lucide-react";
import { Logo } from "@/shared/components/logo";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { LanguageSwitcher } from "@/shared/components/language-switcher";
import { useGetChatConversationsUnreadCount, useGetNotificationsUnreadCount } from "@/api/generated";
import { useTranslations } from "next-intl";
import type { PublicUser } from "@/features/auth/types";

interface ConsumerHeaderProps {
  user: PublicUser;
  pathname: string;
}

export function ConsumerHeader({ user, pathname }: ConsumerHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const t = useTranslations("nav");

  // Smart scroll header: hide on scroll down, reveal on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show when near the very top of the page
      if (currentScrollY < 60) {
        setVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Scrolling down -> hide header; Scrolling up -> reveal header
      if (currentScrollY > lastScrollY.current + 8) {
        if (!mobileMenuOpen && !profileOpen) setVisible(false);
      } else if (currentScrollY < lastScrollY.current - 8) {
        setVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileMenuOpen, profileOpen]);

  // Synchronize CSS custom property --header-offset for seamless docking
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--header-offset",
      visible ? "4rem" : "0px"
    );
    return () => {
      document.documentElement.style.setProperty("--header-offset", "4rem");
    };
  }, [visible]);

  // Close menus and restore visibility on route change (React recommended state adjustment during render)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
    setProfileOpen(false);
    setVisible(true);
  }

  const { data: unreadChatData } = useGetChatConversationsUnreadCount({
    query: { refetchInterval: 30_000 },
  });
  const chatUnreadCount = unreadChatData?.status === 200 ? unreadChatData.data.data.unreadCount : 0;

  const { data: unreadNotifData } = useGetNotificationsUnreadCount({
    query: { refetchInterval: 30_000 },
  });
  const notifUnreadCount = unreadNotifData?.status === 200 ? unreadNotifData.data.data.count : 0;

  const navigation = [
    { href: "/search", label: t("findLawyers"), icon: Search },
    { href: "/ai", label: t("aiAssistant"), icon: Sparkles },
    { href: "/client/dashboard/consultations", label: t("consultations"), icon: Calendar },
    { href: "/client/dashboard/messages", label: t("messages"), icon: MessageSquare },
    { href: "/client/dashboard/saved-experts", label: t("saved"), icon: Bookmark },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleSignOut = async () => {
    await handleAppSignOut({ role: user?.role, pathname });
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm transition-transform duration-300 ease-in-out",
        visible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between sm:h-16">
          {/* Logo */}
          <div className="flex shrink-0 items-center">
            <Logo href="/client/dashboard" iconSize={18} fontSize="text-[14px]" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 mx-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "text-brand-dark dark:text-white bg-gray-100 dark:bg-gray-800"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900"
                  }`}
                >
                  {Icon && <Icon size={16} />}
                  {item.label}
                  {item.href === "/client/dashboard/messages" && chatUnreadCount > 0 && (
                    <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-brand-blue px-1 text-[10px] font-bold text-white">
                      {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {/* Notifications */}
            <Link
              href="/client/dashboard/notifications"
              className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Bell size={18} />
              {notifUnreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-blue px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-950">
                  {notifUnreadCount > 9 ? "9+" : notifUnreadCount}
                </span>
              )}
            </Link>

            {/* Language Switcher */}
            <div className="hidden sm:block">
              <LanguageSwitcher variant="compact" />
            </div>

            {/* Theme Toggle — desktop only */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[#16324f] text-white dark:bg-blue-950/80 dark:text-blue-200 dark:border dark:border-blue-700/50 text-[11px] sm:text-xs font-bold">
                  {getInitials(user.firstName + " " + user.lastName)}
                </div>
              </button>

              {/* Dropdown Menu */}
              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] z-50 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900 p-2">
                    {/* User Info */}
                    <div className="px-3 pb-2 pt-1 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        href="/client/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        <LayoutDashboard size={16} className="text-gray-400" />
                        {t("dashboard")}
                      </Link>
                      <Link
                        href="/client/dashboard/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        <User size={16} className="text-gray-400" />
                        {t("profile")}
                      </Link>
                      <Link
                        href="/client/dashboard/documents"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        <FileText size={16} className="text-gray-400" />
                        {t("documents")}
                      </Link>
                      <Link
                        href="/client/dashboard/payments"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        <CreditCard size={16} className="text-gray-400" />
                        {t("payments")}
                      </Link>
                      <Link
                        href="/client/dashboard/reviews"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        <Star size={16} className="text-gray-400" />
                        {t("myReviews")}
                      </Link>
                      <Link
                        href="/client/dashboard/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        <Settings size={16} className="text-gray-400" />
                        {t("settings")}
                      </Link>
                      <Link
                        href="/client/dashboard/security"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        <Shield size={16} className="text-gray-400" />
                        {t("security")}
                      </Link>
                    </div>

                    {/* Sign Out */}
                    <div className="pt-1 border-t border-gray-100 dark:border-gray-800">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                      >
                        <LogOut size={16} />
                        {t("signOut")}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-200 dark:border-gray-800">
            <nav className="space-y-0.5">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      active
                        ? "text-brand-dark dark:text-white bg-gray-100 dark:bg-gray-800"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                    }`}
                  >
                    {Icon && <Icon size={18} />}
                    {item.label}
                    {item.href === "/client/dashboard/messages" && chatUnreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-blue px-1.5 text-[10px] font-bold text-white">
                        {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
              <Link
                href="/client/dashboard/documents"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive("/client/dashboard/documents")
                    ? "text-brand-dark dark:text-white bg-gray-100 dark:bg-gray-800"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                }`}
              >
                <FileText size={18} />
                {t("documents")}
              </Link>
              <Link
                href="/client/dashboard/payments"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive("/client/dashboard/payments")
                    ? "text-brand-dark dark:text-white bg-gray-100 dark:bg-gray-800"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                }`}
              >
                <CreditCard size={18} />
                {t("payments")}
              </Link>
              <Link
                href="/client/dashboard/reviews"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive("/client/dashboard/reviews")
                    ? "text-brand-dark dark:text-white bg-gray-100 dark:bg-gray-800"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                }`}
              >
                <Star size={18} />
                {t("myReviews")}
              </Link>
            </nav>

            {/* Mobile Language + Theme Toggle */}
            <div className="mt-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-3 pt-3">
              <LanguageSwitcher variant="mobile" />
              <ThemeToggle />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
