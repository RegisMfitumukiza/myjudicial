"use client";

import { useState } from "react";
import {
  Bell,
  Calendar,
  DollarSign,
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
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import {
  PageHeader,
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from "@/shared/components/dashboard";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotificationsRealtime } from "@/features/notifications/hooks/use-notifications-realtime";

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

const formatTime = (dateString: string, t: (key: string, values?: any) => string, locale: string) => {
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
    return date.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateString;
  }
};

export default function NotificationsPage() {
  const t = useTranslations("expertDashboard_notifications");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [page, setPage] = useState(1);

  // Real-time: invalidates both query keys on new broadcast
  useNotificationsRealtime(session?.user?.id);

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
  const hasUnread = unreadCount > 0;

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title={t("title")}
        description={
          hasUnread
            ? t("unreadCount", { count: unreadCount })
            : t("stayUpdated")
        }
        className="mb-6"
        actions={
          <Button
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={!hasUnread || markAllReadMutation.isPending}
          >
            {markAllReadMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck size={14} />
            )}
            {t("markAllRead")}
          </Button>
        }
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState
          title={t("failedToLoad")}
          message={t("tryAgainLater")}
          onRetry={() =>
            queryClient.invalidateQueries({ queryKey: ["notifications", page] })
          }
        />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={t("noNotifications")}
          description={t("willSeeHere")}
        />
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
                  className={cn(
                    "flex cursor-pointer items-start gap-4 rounded-xl border p-5 shadow-sm transition-colors",
                    isUnread
                      ? "border-primary/25 bg-primary/5 dark:border-white/10 dark:bg-white/5"
                      : "border-border bg-card"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      isUnread
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {n.subject || EVENT_LABELS[n.event] || n.event}
                    </p>
                    {n.body && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {n.body}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatTime(n.createdAt, t, locale)}
                    </p>
                  </div>
                  {isUnread && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
              );
            })}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                {t("pageOf", { page: pagination.page, totalPages: pagination.totalPages, total: pagination.total })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft size={14} />
                  {t("previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  {t("next")}
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
