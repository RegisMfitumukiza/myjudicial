"use client";

import { useState } from "react";
import {
  Bell,
  Calendar,
  DollarSign,
  Shield,
  Star,
  MessageSquare,
  FileText,
  CreditCard,
  AlertTriangle,
  Loader2,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { format } from "date-fns";
import { useTranslations } from "next-intl";

type NotificationEvent =
  | "OTP_SENT"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "BOOKING_REMINDER"
  | "PAYMENT_SUCCESS"
  | "ESCROW_RELEASED"
  | "CREDENTIAL_EXPIRY_WARNING"
  | "REVIEW_RECEIVED"
  | "WELCOME"
  | "MAGIC_LINK_SENT"
  | "REFUND_PROCESSED"
  | "MESSAGE_RECEIVED";

interface NotificationItem {
  id: string;
  event: NotificationEvent;
  channel: string;
  subject: string | null;
  body: string | null;
  sent: boolean;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  success: boolean;
  data: NotificationItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

const EVENT_ICONS: Record<NotificationEvent, typeof Bell> = {
  OTP_SENT: FileText,
  BOOKING_CONFIRMED: Calendar,
  BOOKING_CANCELLED: Calendar,
  BOOKING_REMINDER: Calendar,
  PAYMENT_SUCCESS: DollarSign,
  ESCROW_RELEASED: DollarSign,
  CREDENTIAL_EXPIRY_WARNING: AlertTriangle,
  REVIEW_RECEIVED: Star,
  WELCOME: Bell,
  MAGIC_LINK_SENT: FileText,
  REFUND_PROCESSED: CreditCard,
  MESSAGE_RECEIVED: MessageSquare,
};


const formatTime = (dateString: string, t: (key: string, values?: any) => string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("justNow");
    if (diffMins < 60) return t("minAgo", { count: diffMins });
    if (diffHours < 24) return t("hourAgo", { count: diffHours });
    if (diffDays < 7) return t("dayAgo", { count: diffDays });
    return format(date, "MMM dd, yyyy");
  } catch {
    return dateString;
  }
};

export default function NotificationsPage() {
  const t = useTranslations("expertDashboard_notifications");
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const EVENT_LABELS: Record<NotificationEvent, string> = {
    OTP_SENT: t("otpSent"),
    BOOKING_CONFIRMED: t("bookingConfirmed"),
    BOOKING_CANCELLED: t("bookingCancelled"),
    BOOKING_REMINDER: t("bookingReminder"),
    PAYMENT_SUCCESS: t("paymentReceived"),
    ESCROW_RELEASED: t("escrowReleased"),
    CREDENTIAL_EXPIRY_WARNING: t("credentialExpiry"),
    REVIEW_RECEIVED: t("reviewReceived"),
    WELCOME: t("welcome"),
    MAGIC_LINK_SENT: t("magicLinkSent"),
    REFUND_PROCESSED: t("refundProcessed"),
    MESSAGE_RECEIVED: t("newMessage"),
  };

  const { data: notifsData, isLoading, error } = useQuery({
    queryKey: ["notifications", page],
    queryFn: () =>
      apiFetch<NotificationsResponse>(
        `/notifications?page=${page}&limit=20`
      ),
  });

  const { data: unreadData } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: () =>
      apiFetch<UnreadCountResponse>("/notifications/unread-count"),
    refetchInterval: 30000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiFetch("/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const notifications = notifsData?.data ?? [];
  const pagination = notifsData?.pagination;
  const unreadCount = unreadData?.data?.count ?? 0;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-dark dark:text-gray-100">
            {t("title")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {unreadCount > 0
              ? t("unreadCount", { count: unreadCount })
              : t("stayUpdated")}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue/90 disabled:opacity-50"
          >
            {markAllReadMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck size={16} />
            )}
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-brand-border bg-white py-20 shadow-md dark:border-gray-700 dark:bg-gray-900">
          <Bell className="mb-4 h-12 w-12 text-gray-400 dark:text-gray-600" />
          <p className="mb-1 text-lg font-medium text-brand-dark dark:text-gray-100">
            {t("failedToLoad")}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("tryAgainLater")}
          </p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-brand-border bg-white py-20 shadow-md dark:border-gray-700 dark:bg-gray-900">
          <Bell className="mb-4 h-12 w-12 text-gray-400 dark:text-gray-600" />
          <p className="mb-1 text-lg font-medium text-brand-dark dark:text-gray-100">
            {t("noNotifications")}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("willSeeHere")}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {notifications.map((n) => {
              const Icon = EVENT_ICONS[n.event] || Bell;
              const isUnread = !n.readAt;
              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (isUnread) markReadMutation.mutate(n.id);
                  }}
                  className={`flex cursor-pointer items-start gap-4 rounded-xl border p-5 shadow-md transition-colors ${
                    isUnread
                      ? "border-brand-blue/20 bg-blue-50/50 dark:border-blue-800/30 dark:bg-blue-950/20"
                      : "border-brand-border bg-white dark:border-gray-700 dark:bg-gray-900"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      isUnread
                        ? "bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20 dark:text-blue-300"
                        : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-brand-dark dark:text-gray-100">
                      {n.subject || EVENT_LABELS[n.event] || n.event}
                    </p>
                    {n.body && (
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {n.body}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      {formatTime(n.createdAt, t)}
                    </p>
                  </div>
                  {isUnread && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-blue" />
                  )}
                </div>
              );
            })}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-brand-border pt-4 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("pageOf", { page: pagination.page, totalPages: pagination.totalPages, total: pagination.total })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-brand-border bg-white px-3 py-1.5 text-sm font-medium text-brand-dark hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <ChevronLeft size={14} />
                  {t("previous")}
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-brand-border bg-white px-3 py-1.5 text-sm font-medium text-brand-dark hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {t("next")}
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
