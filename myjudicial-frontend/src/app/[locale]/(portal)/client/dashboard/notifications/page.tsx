"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell, CalendarCheck, CalendarX, CreditCard, ShieldCheck,
  AlertTriangle, Star, RotateCcw, CheckCheck, Loader2, MessageSquare,
} from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { apiFetchEnvelope as customFetch } from "@/lib/api/client";
import { useTranslations, useLocale } from "next-intl";

type NotificationEvent =
  | "OTP_SENT" | "BOOKING_CONFIRMED" | "BOOKING_CANCELLED" | "BOOKING_REMINDER"
  | "PAYMENT_SUCCESS" | "ESCROW_RELEASED" | "CREDENTIAL_EXPIRY_WARNING"
  | "REVIEW_RECEIVED" | "WELCOME" | "MAGIC_LINK_SENT" | "REFUND_PROCESSED"
  | "MESSAGE_RECEIVED";

interface NotificationResponse {
  id: string;
  event: NotificationEvent;
  subject?: string;
  body?: string;
  isRead: boolean;
  createdAt: string;
}

const EVENT_ICON: Record<NotificationEvent, typeof Bell> = {
  OTP_SENT: Bell,
  BOOKING_CONFIRMED: CalendarCheck,
  BOOKING_CANCELLED: CalendarX,
  BOOKING_REMINDER: Bell,
  PAYMENT_SUCCESS: CreditCard,
  ESCROW_RELEASED: ShieldCheck,
  CREDENTIAL_EXPIRY_WARNING: AlertTriangle,
  REVIEW_RECEIVED: Star,
  WELCOME: Bell,
  MAGIC_LINK_SENT: Bell,
  REFUND_PROCESSED: RotateCcw,
  MESSAGE_RECEIVED: MessageSquare,
};

type Tab = "all" | "unread";

export default function NotificationsPage() {
  const t = useTranslations("clientDashboard.notifications");
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  function timeAgo(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return t("time.justNow");
    if (mins < 60) return mins === 1 ? t("time.minsAgo", { count: mins }) : t("time.minsAgoPlural", { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours === 1 ? t("time.hoursAgo", { count: hours }) : t("time.hoursAgoPlural", { count: hours });
    const days = Math.floor(hours / 24);
    if (days < 7) return days === 1 ? t("time.daysAgo", { count: days }) : t("time.daysAgoPlural", { count: days });
    return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  }

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const params = activeTab === "unread" ? "?unreadOnly=true" : "";
      const res: any = await customFetch(`/notifications${params}`);
      setNotifications(res.data?.data ?? []);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function handleMarkAllRead() {
    setIsMarkingAll(true);
    try {
      await customFetch("/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silently fail
    } finally {
      setIsMarkingAll(false);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await customFetch(`/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // silently fail
    }
  }

  return (
    <div className="flex h-full flex-col p-6 lg:p-8">
      <div className="mb-6 flex shrink-0 items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-brand-dark dark:text-gray-100">{t("title")}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{t("subtitle")}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={isMarkingAll} className="gap-1.5 text-[13px]">
            {isMarkingAll ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
            {t("markAllRead")}
          </Button>
        )}
      </div>

      <div className="mb-4 flex shrink-0 gap-1">
        {(["all", "unread"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`rounded-lg px-4 py-1.5 text-[13px] font-medium capitalize transition-colors ${
              activeTab === key
                ? "bg-brand-blue text-white"
                : "text-slate-500 dark:text-gray-400 hover:bg-brand-canvas dark:hover:bg-gray-800 hover:text-brand-dark dark:hover:text-gray-100"
            }`}
          >
            {t(`tabs.${key}`)}
          </button>
        ))}
      </div>

      <Card className="flex-1">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-brand-dark/50 dark:text-white/50" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-brand-alert font-medium">{t("failedToLoad")}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted dark:bg-gray-800 shadow-sm">
                <Bell size={24} className="text-slate-400 dark:text-gray-500" />
              </div>
              <p className="text-[15px] font-semibold text-brand-dark dark:text-gray-100">{t("noNotifications")}</p>
              <p className="mt-1 text-[13px] text-slate-500 dark:text-gray-400">
                {activeTab === "unread" ? t("noUnreadDesc") : t("noNotificationsDesc")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-brand-border dark:divide-gray-700">
              {notifications.map((n) => {
                const Icon = EVENT_ICON[n.event] ?? Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => !n.isRead && handleMarkRead(n.id)}
                    className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-brand-canvas dark:hover:bg-gray-800"
                  >
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        n.isRead ? "bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400" : "bg-brand-blue/10 text-brand-blue"
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`truncate text-[14px] ${n.isRead ? "font-medium text-slate-600 dark:text-gray-300" : "font-bold text-brand-dark dark:text-gray-100"}`}>
                          {n.subject ?? (t.has(`events.${n.event}`) ? t(`events.${n.event}`) : t("title"))}
                        </p>
                        {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-blue" />}
                      </div>
                      {n.body && (
                        <p className="mt-0.5 truncate text-[13px] text-slate-500 dark:text-gray-400">{n.body}</p>
                      )}
                      <p className="mt-1 text-[11px] text-slate-400 dark:text-gray-500">{timeAgo(n.createdAt)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
