"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bell,
  Mail,
  TrendingUp,
  Send,
  CheckCircle,
  Clock,
  Eye,
  Users,
  BarChart3,
  Search,
  Filter,
  CheckCheck,
  Inbox,
  ShieldCheck,
  AlertTriangle,
  CalendarCheck,
  CreditCard,
  Star,
  MessageSquare,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/client";
import {
  getGetNotificationsUnreadCountQueryKey,
  useGetNotificationsUnreadCount,
} from "@/api/generated";
import { useTranslations, useLocale } from "next-intl";
import { PageHeader } from "@/shared/components/dashboard/page-header";
import { StatCard } from "@/shared/components/dashboard/stat-card";
import { StatusBadge, type StatusTone } from "@/shared/components/dashboard/status-badge";
import { SkeletonCard, SkeletonList, TableSectionSkeleton } from "@/shared/components/dashboard/loading";
import { ErrorState } from "@/shared/components/dashboard/error-state";
import { EmptyState } from "@/shared/components/dashboard/empty-state";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

type NotificationChannel = "EMAIL" | "PUSH";
type NotificationEvent =
  | "WELCOME"
  | "VERIFICATION_APPROVED"
  | "VERIFICATION_REJECTED"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "BOOKING_COMPLETED"
  | "PAYMENT_SUCCESSFUL"
  | "PAYMENT_FAILED"
  | "ESCROW_RECEIVED"
  | "ESCROW_RELEASED"
  | "REFUND_INITIATED"
  | "REVIEW_RECEIVED"
  | "ANNUAL_REVERIFICATION_DUE"
  | "COMPLIANCE_WARNING"
  | "ACCOUNT_SUSPENDED";

interface NotificationStats {
  totalLogs: number;
  sentToday: number;
  sentThisWeek: number;
  successRate: number;
  failedRecent: number;
  byChannel: Array<{
    channel: NotificationChannel;
    count: number;
  }>;
  byEvent: Array<{
    event: NotificationEvent;
    count: number;
  }>;
}

interface NotificationLog {
  id: string;
  event: NotificationEvent;
  channel: NotificationChannel;
  recipient: string;
  subject: string;
  body: string;
  sent: boolean;
  sentAt: string | null;
  errorMsg: string | null;
  deliveryStatus: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

interface NotificationLogsResponse {
  data: {
    logs: NotificationLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

const fetchStats = async (): Promise<{ data: NotificationStats }> => {
  return apiFetch("/admin/notifications/stats");
};

const fetchLogs = async (params: {
  page?: number;
  limit?: number;
  sent?: boolean;
  channel?: NotificationChannel;
  search?: string;
}): Promise<NotificationLogsResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.sent !== undefined) queryParams.append("sent", params.sent.toString());
  if (params.channel) queryParams.append("channel", params.channel);
  if (params.search) queryParams.append("search", params.search);
  return apiFetch(`/admin/notifications/logs?${queryParams.toString()}`);
};

const sendBroadcast = async (data: {
  title: string;
  message: string;
  audience: string;
  channels: NotificationChannel[];
}) => {
  return apiFetch("/admin/notifications/broadcast", { method: "POST", body: data });
};

const CHANNEL_TONE: Record<NotificationChannel, StatusTone> = {
  EMAIL: "info",
  PUSH: "warning",
};

function getNotificationEventIcon(event?: string) {
  if (!event) return Bell;
  if (event.includes("VERIF")) return ShieldCheck;
  if (event.includes("BOOKING")) return CalendarCheck;
  if (event.includes("PAYMENT") || event.includes("ESCROW") || event.includes("REFUND")) return CreditCard;
  if (event.includes("REVIEW")) return Star;
  if (event.includes("MESSAGE")) return MessageSquare;
  if (event.includes("WARN") || event.includes("SUSPEND")) return AlertTriangle;
  return Bell;
}

export default function NotificationsPage() {
  const t = useTranslations("admin.notifications");
  const tClient = useTranslations("clientDashboard.notifications");
  const tAudit = useTranslations("admin.auditLogs");
  const tPagination = useTranslations("common.pagination");
  const locale = useLocale();

  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "inbox" | "compose" | "history") || "inbox";
  const [activeTab, setActiveTab] = useState<"inbox" | "compose" | "history">(initialTab);

  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);

  const channelLabels: Record<NotificationChannel, string> = {
    EMAIL: "Email",
    PUSH: "In-App",
  };

  const audienceLabels: Record<string, string> = {
    ALL: t("allUsers"),
    EXPERT: t("expertsOnly"),
    CITIZEN: t("citizensOnly"),
    ADMIN: t("adminsOnly"),
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    const tab = searchParams.get("tab") as "inbox" | "compose" | "history" | null;
    if (tab && ["inbox", "compose", "history"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // ── Personal Inbox State ──
  const [inboxFilter, setInboxFilter] = useState<"all" | "unread">("all");
  const [inboxPage, setInboxPage] = useState(1);

  const { data: unreadNotifData } = useGetNotificationsUnreadCount({
    query: { refetchInterval: 30_000 },
  });
  const unreadCount = unreadNotifData?.status === 200 ? unreadNotifData.data.data.count : 0;

  const {
    data: inboxData,
    isLoading: loadingInbox,
    error: inboxError,
  } = useQuery({
    queryKey: ["my-notifications", inboxPage, inboxFilter],
    queryFn: () =>
      apiFetch<{
        data: Array<{
          id: string;
          event: string;
          channel: string;
          subject?: string;
          body?: string;
          readAt?: string | null;
          createdAt: string;
        }>;
        pagination?: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>(
        `/notifications?page=${inboxPage}&limit=15${inboxFilter === "unread" ? "&unreadOnly=true" : ""}`
      ),
    enabled: activeTab === "inbox",
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiFetch("/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
      queryClient.invalidateQueries({ queryKey: getGetNotificationsUnreadCountQueryKey() });
      toast.success(tClient("markAllRead"));
    },
    onError: () => toast.error(tClient("failedToLoad")),
  });

  const markSingleReadMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
      queryClient.invalidateQueries({ queryKey: getGetNotificationsUnreadCountQueryKey() });
    },
    onError: () => toast.error(tClient("failedToLoad")),
  });

  const myNotifications = inboxData?.data ?? [];
  const inboxPagination = inboxData?.pagination;

  // ── Platform Broadcast & Logs State ──
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<NotificationChannel | "ALL">("ALL");
  const [sentFilter, setSentFilter] = useState<"ALL" | "SENT" | "UNSENT">("ALL");

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("ALL");
  const [selectedChannels, setSelectedChannels] = useState<NotificationChannel[]>(["EMAIL"]);

  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-notifications-stats"],
    queryFn: fetchStats,
  });

  const { data: logsData, isLoading: loadingLogs, error } = useQuery({
    queryKey: ["admin-notifications-logs", page, searchQuery, channelFilter, sentFilter],
    queryFn: () => {
      let sentValue: boolean | undefined = undefined;
      if (sentFilter === "SENT") sentValue = true;
      if (sentFilter === "UNSENT") sentValue = false;
      return fetchLogs({
        page,
        limit: 20,
        search: searchQuery || undefined,
        channel: channelFilter !== "ALL" ? channelFilter : undefined,
        sent: sentValue,
      });
    },
    enabled: activeTab === "history",
  });

  const broadcastMutation = useMutation({
    mutationFn: sendBroadcast,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications-logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications-stats"] });
      setTitle("");
      setMessage("");
      setAudience("ALL");
      setSelectedChannels(["EMAIL"]);
    },
  });

  const stats = statsData?.data;
  const logs = logsData?.data?.logs ?? [];
  const pagination = logsData?.data?.pagination;

  const handleChannelToggle = (channel: NotificationChannel) => {
    if (selectedChannels.includes(channel)) {
      setSelectedChannels(selectedChannels.filter((c) => c !== channel));
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }
  };

  const handleSend = () => {
    if (!title.trim() || !message.trim() || selectedChannels.length === 0) return;
    broadcastMutation.mutate({
      title: title.trim(),
      message: message.trim(),
      audience,
      channels: selectedChannels,
    });
  };

  const handleSearch = () => {
    setPage(1);
    queryClient.invalidateQueries({ queryKey: ["admin-notifications-logs"] });
  };

  const handleReset = () => {
    setSearchQuery("");
    setChannelFilter("ALL");
    setSentFilter("ALL");
    setPage(1);
  };

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <PageHeader
        title={tClient("title")}
        description={t("subtitle")}
      />

      {loadingStats ? (
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            label={t("totalLogs")}
            value={stats.totalLogs.toLocaleString(locale)}
            icon={Bell}
          />
          <StatCard
            label={t("sentToday")}
            value={stats.sentToday.toLocaleString(locale)}
            icon={TrendingUp}
          />
          <StatCard
            label={t("sentThisWeek")}
            value={stats.sentThisWeek.toLocaleString(locale)}
            icon={BarChart3}
          />
          <StatCard
            label={t("successRate")}
            value={`${stats.successRate}%`}
            icon={CheckCircle}
          />
          <StatCard
            label={t("failed7d")}
            value={stats.failedRecent.toLocaleString(locale)}
            icon={BarChart3}
          />
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("byChannel")}
                </p>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                {stats.byChannel.map((item) => (
                  <div key={item.channel} className="flex items-center gap-2 text-sm">
                    <StatusBadge tone={CHANNEL_TONE[item.channel]} dot={false}>
                      {channelLabels[item.channel]}
                    </StatusBadge>
                    <span className="font-medium text-foreground">
                      {item.count.toLocaleString(locale)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "inbox" | "compose" | "history")}
      >
        <TabsList variant="line" className="w-full justify-start overflow-x-auto scrollbar-none">
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox size={14} />
            {tClient("title")}
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-blue px-1.5 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="compose" className="gap-2">
            <Send size={14} />
            {t("sendBroadcast")}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock size={14} />
            {t("history")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-6 space-y-4">
          {/* Inbox Filter & Actions Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={inboxFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => { setInboxFilter("all"); setInboxPage(1); }}
              >
                {tClient("tabs.all")}
              </Button>
              <Button
                variant={inboxFilter === "unread" ? "default" : "outline"}
                size="sm"
                onClick={() => { setInboxFilter("unread"); setInboxPage(1); }}
                className="gap-1.5"
              >
                {tClient("tabs.unread")}
                {unreadCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-bold text-foreground">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
              >
                <CheckCheck size={14} />
                {tClient("markAllRead")}
              </Button>
            )}
          </div>

          {/* Inbox List */}
          {loadingInbox ? (
            <SkeletonList count={4} itemClassName="h-24 rounded-xl" />
          ) : inboxError ? (
            <ErrorState
              title={tClient("failedToLoad")}
              message={inboxError instanceof Error ? inboxError.message : "Unable to load inbox notifications."}
              onRetry={() => queryClient.invalidateQueries({ queryKey: ["my-notifications"] })}
            />
          ) : myNotifications.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={tClient("noNotifications")}
              description={inboxFilter === "unread" ? tClient("noUnreadDesc") : tClient("noNotificationsDesc")}
            />
          ) : (
            <div className="space-y-3">
              {myNotifications.map((n) => {
                const EventIcon = getNotificationEventIcon(n.event);
                const isUnread = !n.readAt;

                return (
                  <Card
                    key={n.id}
                    className={`transition-colors ${
                      isUnread
                        ? "border-primary/30 bg-primary/5 dark:bg-primary/10"
                        : "bg-card"
                    }`}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          isUnread ? "bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" : "bg-muted text-muted-foreground"
                        }`}>
                          <EventIcon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {isUnread && (
                              <span className="h-2 w-2 rounded-full bg-brand-blue shrink-0" />
                            )}
                            <h4 className={`text-sm ${isUnread ? "font-semibold text-foreground" : "font-medium text-muted-foreground"}`}>
                              {n.subject || "Notification"}
                            </h4>
                          </div>
                          {n.body && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {n.body}
                            </p>
                          )}
                          <p className="mt-2 text-[11px] text-muted-foreground">
                            {formatDate(n.createdAt)}
                          </p>
                        </div>
                        {isUnread && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => markSingleReadMutation.mutate(n.id)}
                            disabled={markSingleReadMutation.isPending}
                          >
                            <CheckCheck size={14} className="sm:mr-1" />
                            <span className="hidden sm:inline">Mark read</span>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Pagination */}
              {inboxPagination && inboxPagination.pages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground">
                    {t("showingPage", {
                      page: inboxPagination.page,
                      totalPages: inboxPagination.pages,
                      total: inboxPagination.total,
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInboxPage((p) => Math.max(p - 1, 1))}
                      disabled={inboxPage === 1}
                    >
                      {tPagination("previous")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInboxPage((p) => p + 1)}
                      disabled={inboxPage >= inboxPagination.pages}
                    >
                      {tPagination("next")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="compose" className="mt-6">
          <Card>
            <CardContent className="pt-5">
              <h2 className="mb-4 text-lg font-semibold text-foreground">{t("sendBroadcast")}</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="mb-1 block text-sm font-medium text-foreground">
                    {t("title")}
                  </label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("titlePlaceholder")}
                    maxLength={200}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {title.length}/200 {t("characters")}
                  </p>
                </div>

                <div>
                  <label htmlFor="message" className="mb-1 block text-sm font-medium text-foreground">
                    {t("message")}
                  </label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("messagePlaceholder")}
                    rows={6}
                    maxLength={1000}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {message.length}/1000 {t("characters")}
                  </p>
                </div>

                <div>
                  <label htmlFor="audience" className="mb-1 block text-sm font-medium text-foreground">
                    {t("audience")}
                  </label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger id="audience" className="w-full">
                      <SelectValue placeholder={t("audience")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">{t("allUsers")}</SelectItem>
                      <SelectItem value="CITIZEN">{t("citizensOnly")}</SelectItem>
                      <SelectItem value="EXPERT">{t("expertsOnly")}</SelectItem>
                      <SelectItem value="ADMIN">{t("adminsOnly")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    {t("channels")}
                  </label>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedChannels.includes("EMAIL")}
                        onChange={() => handleChannelToggle("EMAIL")}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                      <Mail size={16} className="text-primary" />
                      <span className="text-sm text-foreground">Email</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedChannels.includes("PUSH")}
                        onChange={() => handleChannelToggle("PUSH")}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                      <Bell size={16} className="text-warning" />
                      <span className="text-sm text-foreground">In-App</span>
                    </label>
                  </div>
                  {selectedChannels.length === 0 && (
                    <p className="mt-1 text-xs text-destructive">
                      {t("selectChannel")}
                    </p>
                  )}
                </div>

                {broadcastMutation.isSuccess && (
                  <div className="rounded-lg bg-success/10 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 text-success" />
                      <div>
                        <p className="text-sm font-medium text-success">
                          {t("broadcastSent")}
                        </p>
                        <p className="mt-1 text-sm text-success/80">
                          {t("broadcastQueued", { audience: audienceLabels[audience] || audience })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {broadcastMutation.isError && (
                  <div className="rounded-lg bg-destructive/10 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
                      <div>
                        <p className="text-sm font-medium text-destructive">
                          {t("failedToSend")}
                        </p>
                        <p className="mt-1 text-sm text-destructive/80">
                          {(broadcastMutation.error as any)?.response?.data?.message || t("errorOccurred")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSend}
                    disabled={
                      !title.trim() ||
                      !message.trim() ||
                      selectedChannels.length === 0 ||
                      broadcastMutation.isPending
                    }
                  >
                    {broadcastMutation.isPending ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" />
                        {t("sending")}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {t("sendBroadcast")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                  <div className="flex-1">
                    <label htmlFor="search" className="mb-1 block text-sm font-medium text-foreground">
                      {t("search")}
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t("searchPlaceholder")}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="w-full lg:w-48">
                    <label htmlFor="channel-filter" className="mb-1 block text-sm font-medium text-foreground">
                      {tAudit("resource")}
                    </label>
                    <Select
                      value={channelFilter}
                      onValueChange={(v) => setChannelFilter(v as NotificationChannel | "ALL")}
                    >
                      <SelectTrigger id="channel-filter" className="w-full">
                        <SelectValue placeholder={t("allChannels")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">{t("allChannels")}</SelectItem>
                        <SelectItem value="EMAIL">Email</SelectItem>
                        <SelectItem value="PUSH">In-App</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full lg:w-48">
                    <label htmlFor="sent-filter" className="mb-1 block text-sm font-medium text-foreground">
                      {tAudit("action")}
                    </label>
                    <Select
                      value={sentFilter}
                      onValueChange={(v) => setSentFilter(v as "ALL" | "SENT" | "UNSENT")}
                    >
                      <SelectTrigger id="sent-filter" className="w-full">
                        <SelectValue placeholder={t("allStatuses")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
                        <SelectItem value="SENT">{t("sent")}</SelectItem>
                        <SelectItem value="UNSENT">{t("failed")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSearch}>
                      <Filter className="h-4 w-4" />
                      {t("filter")}
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                      {t("reset")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              {loadingLogs ? (
                <TableSectionSkeleton rows={5} columns={5} className="border-0 rounded-none shadow-none" />
              ) : error ? (
                <ErrorState
                  title={t("failedToLoadLogs")}
                  onRetry={() => queryClient.invalidateQueries({ queryKey: ["admin-notifications-logs"] })}
                />
              ) : logs.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title={t("noLogs")}
                  description={t("noLogsHint")}
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-border">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {tAudit("timestamp")}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {tAudit("actor")}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Channel
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {tAudit("action")}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {tAudit("actions")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {logs.map((log) => (
                          <tr
                            key={log.id}
                            className="transition-colors hover:bg-muted/50"
                          >
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                              {formatDate(log.sentAt || log.createdAt)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                <div className="font-medium text-foreground">
                                  {log.user ? `${log.user.firstName} ${log.user.lastName}` : "Unknown"}
                                </div>
                                <div className="text-muted-foreground">{log.recipient}</div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <StatusBadge tone={CHANNEL_TONE[log.channel]} dot={false}>
                                {channelLabels[log.channel]}
                              </StatusBadge>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {log.event.replace(/_/g, " ")}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              {log.sent ? (
                                <StatusBadge tone="success">{t("sent")}</StatusBadge>
                              ) : log.errorMsg ? (
                                <StatusBadge tone="destructive">{t("failed")}</StatusBadge>
                              ) : (
                                <StatusBadge tone="pending">Pending</StatusBadge>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary/80"
                                onClick={() => setSelectedLog(log)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                {t("viewDetails")}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border px-4 sm:px-6 py-3">
                      <div className="text-sm text-muted-foreground">
                        {t("showingPage", {
                          page: pagination.page,
                          totalPages: pagination.totalPages,
                          total: pagination.total,
                        })}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                        >
                          {tPagination("previous")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page + 1)}
                          disabled={page >= pagination.totalPages}
                        >
                          {tPagination("next")}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Log Details Modal */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                {t("viewDetails")}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-sm">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3 bg-muted/30">
                <div>
                  <p className="text-xs text-muted-foreground">{tAudit("timestamp")}</p>
                  <p className="font-medium text-foreground">
                    {formatDate(selectedLog.sentAt || selectedLog.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{tAudit("action")}</p>
                  <p className="font-medium text-foreground">
                    {selectedLog.event.replace(/_/g, " ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Channel</p>
                  <p className="font-medium text-foreground">
                    {channelLabels[selectedLog.channel]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium text-foreground">
                    {selectedLog.sent ? t("sent") : selectedLog.errorMsg ? t("failed") : "Pending"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {tAudit("actor")}
                </p>
                <div className="mt-1 rounded-md border border-border bg-card p-3">
                  <p className="font-medium text-foreground">
                    {selectedLog.user ? `${selectedLog.user.firstName} ${selectedLog.user.lastName}` : "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedLog.recipient}</p>
                </div>
              </div>

              {selectedLog.subject && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Subject
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {selectedLog.subject}
                  </p>
                </div>
              )}

              {selectedLog.body && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("message")}
                  </p>
                  <div className="mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                    {selectedLog.body}
                  </div>
                </div>
              )}

              {selectedLog.errorMsg && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <p className="font-semibold">{t("failed")}:</p>
                  <p className="mt-0.5">{selectedLog.errorMsg}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
