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
  Clock,
  ArrowUpRight,
  Check,
  Inbox,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import {
  EmptyState,
  ErrorState,
  SkeletonList,
} from "@/shared/components/dashboard";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/lib/utils";
import { getGetNotificationsUnreadCountQueryKey } from "@/api/generated";
import { toast } from "sonner";

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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");
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
    queryKey: ["notifications", page, filter],
    queryFn: () =>
      apiFetch<NotificationsResponse>(
        `/notifications?page=${page}&limit=20${filter === "unread" ? "&unreadOnly=true" : ""}`
      ),
  });

  const { data: unreadData } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: () =>
      apiFetch<UnreadCountResponse>("/notifications/unread-count"),
    refetchInterval: 30000,
  });

  const invalidateAllNotifs = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    queryClient.invalidateQueries({
      queryKey: getGetNotificationsUnreadCountQueryKey(),
    });
    queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
  };

  const markAllReadMutation = useMutation({
    mutationFn: () => apiFetch("/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => {
      invalidateAllNotifs();
      toast.success(t("allMarkedRead"));
    },
    onError: () => {
      toast.error(t("failedToLoad"));
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => {
      invalidateAllNotifs();
    },
  });

  const notifications = notifsData?.data ?? [];
  const pagination = notifsData?.pagination;
  const unreadCount = unreadData?.data?.count ?? 0;
  const hasUnread = unreadCount > 0;

  function getNotificationAction(event: NotificationEvent) {
    switch (event) {
      case "BOOKING_CONFIRMED":
      case "BOOKING_CANCELLED":
      case "BOOKING_REMINDER":
        return {
          url: "/expert/dashboard/consultations",
          label: t("actions.viewConsultation"),
        };
      case "PAYMENT_SUCCESS":
      case "ESCROW_RELEASED":
      case "REFUND_PROCESSED":
        return {
          url: "/expert/dashboard/earnings",
          label: t("actions.viewEarnings"),
        };
      case "MESSAGE_RECEIVED":
        return {
          url: "/expert/dashboard/messages",
          label: t("actions.viewMessage"),
        };
      case "REVIEW_RECEIVED":
        return {
          url: "/expert/dashboard/reviews",
          label: t("actions.viewReview"),
        };
      case "CREDENTIAL_EXPIRY_WARNING":
        return {
          url: "/expert/dashboard/compliance",
          label: t("actions.viewCompliance"),
        };
      default:
        return null;
    }
  }

  function handleItemClick(n: NotificationItem) {
    if (!n.readAt) {
      markReadMutation.mutate(n.id);
    }
    const action = getNotificationAction(n.event);
    if (action?.url) {
      router.push(action.url);
    }
  }

  return (
    <div className="p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0 max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {t("title")}
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {unreadCount} {t("tabs.unread")}
              </span>
            )}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {hasUnread
              ? t("unreadCount", { count: unreadCount })
              : t("stayUpdated")}
          </p>
        </div>

        {hasUnread && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="w-full min-[480px]:w-auto shrink-0 gap-1.5 text-xs sm:text-[13px] font-medium"
          >
            {markAllReadMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck size={14} />
            )}
            {t("markAllRead")}
          </Button>
        )}
      </div>

      {/* Filter Tabs with Badge */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setFilter("all");
            setPage(1);
          }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs sm:text-[13px] font-semibold transition-all min-h-[36px]",
            filter === "all"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <span>{t("tabs.all")}</span>
        </button>

        <button
          onClick={() => {
            setFilter("unread");
            setPage(1);
          }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs sm:text-[13px] font-semibold transition-all min-h-[36px]",
            filter === "unread"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <span>{t("tabs.unread")}</span>
          {unreadCount > 0 && (
            <span
              className={cn(
                "flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                filter === "unread"
                  ? "bg-primary-foreground text-primary"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <SkeletonList count={4} itemClassName="h-24 rounded-xl" />
      ) : error ? (
        <ErrorState
          title={t("failedToLoad")}
          message={t("tryAgainLater")}
          onRetry={() =>
            queryClient.invalidateQueries({ queryKey: ["notifications", page, filter] })
          }
        />
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border bg-card/50 p-6 sm:p-12">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground shadow-xs">
            {filter === "unread" ? <CheckCheck size={26} /> : <Inbox size={26} />}
          </div>
          <p className="text-base font-semibold text-foreground">
            {filter === "unread" ? t("allCaughtUp") : t("noNotifications")}
          </p>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-sm">
            {filter === "unread"
              ? t("noUnreadDesc")
              : t("willSeeHere")}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2.5 sm:space-y-3">
            {notifications.map((n) => {
              const Icon = EVENT_ICONS[n.event] || Bell;
              const isUnread = !n.readAt;
              const action = getNotificationAction(n.event);

              return (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleItemClick(n);
                    }
                  }}
                  className={cn(
                    "group relative flex items-start gap-3 min-[400px]:gap-3.5 sm:gap-4 p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer text-left select-none",
                    isUnread
                      ? "border-blue-500/35 bg-blue-500/[0.035] dark:bg-blue-500/[0.08] shadow-xs hover:border-blue-500/50"
                      : "border-border bg-card hover:bg-muted/40 hover:border-border/80"
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "flex h-8 w-8 min-[380px]:h-9 min-[380px]:w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl transition-colors mt-0.5",
                      isUnread
                        ? "bg-blue-500/15 text-blue-600 dark:bg-blue-500/25 dark:text-blue-400"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon size={16} className="sm:h-4.5 sm:w-4.5" />
                  </div>

                  {/* Body Content - FULL WRAP, ZERO TRUNCATION */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={cn(
                          "text-xs min-[360px]:text-sm sm:text-[15px] leading-snug break-words",
                          isUnread
                            ? "font-bold text-foreground"
                            : "font-medium text-muted-foreground"
                        )}
                      >
                        {n.subject || EVENT_LABELS[n.event] || n.event}
                      </h3>

                      {isUnread && (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-blue-600 dark:bg-blue-500 mt-1.5 shadow-xs"
                          aria-label="Unread"
                        />
                      )}
                    </div>

                    {n.body && (
                      <p className="mt-1 text-xs sm:text-[13px] leading-relaxed text-muted-foreground break-words whitespace-normal">
                        {n.body}
                      </p>
                    )}

                    {/* Metadata & Action Row */}
                    <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap pt-0.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground/75">
                        <Clock size={11} className="shrink-0" />
                        {formatTime(n.createdAt, t, locale)}
                      </span>

                      <div className="flex items-center gap-2 ml-auto">
                        {action && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary group-hover:underline">
                            {action.label}
                            <ArrowUpRight
                              size={12}
                              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            />
                          </span>
                        )}

                        {isUnread && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markReadMutation.mutate(n.id);
                            }}
                            title={t("markAsRead")}
                            className="inline-flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                            aria-label={t("markAsRead")}
                          >
                            <Check size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t("pageOf", {
                  page: pagination.page,
                  totalPages: pagination.totalPages,
                  total: pagination.total,
                })}
              </p>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex-1 sm:flex-none"
                >
                  <ChevronLeft size={14} className="mr-1" />
                  {t("previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  disabled={page >= pagination.totalPages}
                  className="flex-1 sm:flex-none"
                >
                  {t("next")}
                  <ChevronRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
