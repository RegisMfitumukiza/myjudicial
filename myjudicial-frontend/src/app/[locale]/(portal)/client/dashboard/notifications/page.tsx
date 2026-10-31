"use client";

import { useState } from "react";
import {
  Bell,
  CalendarCheck,
  CalendarX,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Star,
  RotateCcw,
  CheckCheck,
  Loader2,
  MessageSquare,
  Clock,
  ArrowUpRight,
  Inbox,
  Check,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { SkeletonList } from "@/shared/components/dashboard/loading";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetchEnvelope as customFetch } from "@/lib/api/client";
import {
  getGetNotificationsUnreadCountQueryKey,
  useGetNotificationsUnreadCount,
} from "@/api/generated";
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("all");

  // Relative time formatter
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

  // 1. Fetch notifications via TanStack Query (reactive to activeTab and realtime events)
  const {
    data: notifsResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["notifications", activeTab],
    queryFn: () =>
      customFetch<any>(
        `/notifications${activeTab === "unread" ? "?unreadOnly=true" : ""}`
      ),
  });

  const notifications: NotificationResponse[] =
    notifsResponse?.data?.data ?? [];

  // 2. Fetch live unread count
  const { data: unreadCountData } = useGetNotificationsUnreadCount({
    query: { refetchInterval: 30_000 },
  });
  const unreadCount =
    unreadCountData?.status === 200 ? unreadCountData.data.data.count : 0;

  // 3. Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => customFetch("/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: getGetNotificationsUnreadCountQueryKey(),
      });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
      queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
      toast.success(t("allMarkedRead"));
    },
    onError: () => {
      toast.error(t("failedToLoad"));
    },
  });

  // 4. Mark single item as read mutation
  const markSingleReadMutation = useMutation({
    mutationFn: (id: string) =>
      customFetch(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: getGetNotificationsUnreadCountQueryKey(),
      });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
      queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
    },
  });

  // Smart action destination based on event type
  function getNotificationAction(event: NotificationEvent) {
    switch (event) {
      case "BOOKING_CONFIRMED":
      case "BOOKING_REMINDER":
      case "BOOKING_CANCELLED":
        return {
          url: "/client/dashboard/consultations",
          label: t("actions.viewConsultation"),
        };
      case "PAYMENT_SUCCESS":
      case "ESCROW_RELEASED":
      case "REFUND_PROCESSED":
        return {
          url: "/client/dashboard/payments",
          label: t("actions.viewPayment"),
        };
      case "MESSAGE_RECEIVED":
        return {
          url: "/client/dashboard/messages",
          label: t("actions.viewMessage"),
        };
      case "REVIEW_RECEIVED":
        return {
          url: "/client/dashboard/consultations",
          label: t("actions.viewReview"),
        };
      default:
        return null;
    }
  }

  function handleItemClick(n: NotificationResponse) {
    if (!n.isRead) {
      markSingleReadMutation.mutate(n.id);
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
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-blue/10 text-brand-blue border border-brand-blue/20">
                {unreadCount} {t("tabs.unread")}
              </span>
            )}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="w-full min-[480px]:w-auto shrink-0 gap-1.5 text-xs sm:text-[13px] font-medium"
          >
            {markAllReadMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCheck size={14} />
            )}
            {t("markAllRead")}
          </Button>
        )}
      </div>

      {/* Filter Tabs with Live Badges */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab("all")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs sm:text-[13px] font-semibold transition-all min-h-[36px]",
            activeTab === "all"
              ? "bg-brand-blue text-white shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <span>{t("tabs.all")}</span>
        </button>

        <button
          onClick={() => setActiveTab("unread")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs sm:text-[13px] font-semibold transition-all min-h-[36px]",
            activeTab === "unread"
              ? "bg-brand-blue text-white shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <span>{t("tabs.unread")}</span>
          {unreadCount > 0 && (
            <span
              className={cn(
                "flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                activeTab === "unread"
                  ? "bg-white text-brand-blue"
                  : "bg-brand-blue text-white"
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Main List Container */}
      {isLoading ? (
        <SkeletonList count={4} itemClassName="h-24 rounded-xl" />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border bg-card p-6">
          <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
          <p className="text-sm sm:text-base font-semibold text-foreground">
            {t("failedToLoad")}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border bg-card/50 p-6 sm:p-12">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground shadow-xs">
            {activeTab === "unread" ? <CheckCheck size={26} /> : <Inbox size={26} />}
          </div>
          <p className="text-base font-semibold text-foreground">
            {activeTab === "unread" ? t("allCaughtUp") : t("noNotifications")}
          </p>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-sm">
            {activeTab === "unread"
              ? t("noUnreadDesc")
              : t("noNotificationsDesc")}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 sm:space-y-3">
          {notifications.map((n) => {
            const Icon = EVENT_ICON[n.event] ?? Bell;
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
                  !n.isRead
                    ? "border-brand-blue/35 bg-brand-blue/[0.035] dark:bg-brand-blue/[0.08] shadow-xs hover:border-brand-blue/50"
                    : "border-border bg-card hover:bg-muted/40 hover:border-border/80"
                )}
              >
                {/* Visual Icon */}
                <div
                  className={cn(
                    "flex h-8 w-8 min-[380px]:h-9 min-[380px]:w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl transition-colors mt-0.5",
                    !n.isRead
                      ? "bg-brand-blue/15 text-brand-blue dark:bg-brand-blue/25"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon size={16} className="sm:h-4.5 sm:w-4.5" />
                </div>

                {/* Body Content - FULLY WRAPPED, ZERO TRUNCATION */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={cn(
                        "text-xs min-[360px]:text-sm sm:text-[15px] leading-snug break-words",
                        !n.isRead
                          ? "font-bold text-foreground"
                          : "font-medium text-muted-foreground"
                      )}
                    >
                      {n.subject ?? (t.has(`events.${n.event}`) ? t(`events.${n.event}`) : t("title"))}
                    </h3>

                    {!n.isRead && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-brand-blue mt-1.5 shadow-xs"
                        aria-label="Unread"
                      />
                    )}
                  </div>

                  {/* Body text: break-words whitespace-normal text-wrap */}
                  {n.body && (
                    <p className="mt-1 text-xs sm:text-[13px] leading-relaxed text-muted-foreground break-words whitespace-normal">
                      {n.body}
                    </p>
                  )}

                  {/* Metadata & Action Row */}
                  <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap pt-0.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground/75">
                      <Clock size={11} className="shrink-0" />
                      {timeAgo(n.createdAt)}
                    </span>

                    <div className="flex items-center gap-2 ml-auto">
                      {action && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-blue group-hover:underline">
                          {action.label}
                          <ArrowUpRight
                            size={12}
                            className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          />
                        </span>
                      )}

                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markSingleReadMutation.mutate(n.id);
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
      )}
    </div>
  );
}
