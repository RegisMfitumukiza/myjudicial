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
import { getGetNotificationsUnreadCountQueryKey, useGetNotificationsUnreadCount } from "@/api/generated";
import { format } from "date-fns";
import { PageHeader } from "@/shared/components/dashboard/page-header";
import { StatCard } from "@/shared/components/dashboard/stat-card";
import { StatusBadge, type StatusTone } from "@/shared/components/dashboard/status-badge";
import { LoadingSpinner } from "@/shared/components/dashboard/loading";
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

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  EMAIL: "Email",
  PUSH: "In-App",
};

const CHANNEL_TONE: Record<NotificationChannel, StatusTone> = {
  EMAIL: "info",
  PUSH: "warning",
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "\u2014";
  try {
    return format(new Date(dateString), "MMM dd, yyyy HH:mm");
  } catch {
    return dateString;
  }
};

const AUDIENCE_LABELS: Record<string, string> = {
  ALL: "All Users",
  EXPERT: "Experts Only",
  CITIZEN: "Citizens Only",
  ADMIN: "Admins Only",
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
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "inbox" | "compose" | "history") || "inbox";
  const [activeTab, setActiveTab] = useState<"inbox" | "compose" | "history">(initialTab);

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
      toast.success("All notifications marked as read");
    },
    onError: () => toast.error("Failed to mark notifications as read"),
  });

  const markSingleReadMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
      queryClient.invalidateQueries({ queryKey: getGetNotificationsUnreadCountQueryKey() });
    },
    onError: () => toast.error("Failed to mark notification as read"),
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
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Notifications"
        description="Send broadcasts and view notification history"
      />

      {loadingStats ? (
        <LoadingSpinner label="Loading notification data..." />
      ) : stats ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total Logs"
            value={stats.totalLogs.toLocaleString()}
            icon={Bell}
          />
          <StatCard
            label="Sent Today"
            value={stats.sentToday.toLocaleString()}
            icon={TrendingUp}
          />
          <StatCard
            label="Sent This Week"
            value={stats.sentThisWeek.toLocaleString()}
            icon={BarChart3}
          />
          <StatCard
            label="Success Rate"
            value={`${stats.successRate}%`}
            icon={CheckCircle}
          />
          <StatCard
            label="Failed (7 days)"
            value={stats.failedRecent.toLocaleString()}
            icon={BarChart3}
          />
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  By Channel
                </p>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                {stats.byChannel.map((item) => (
                  <div key={item.channel} className="flex items-center gap-2 text-sm">
                    <StatusBadge tone={CHANNEL_TONE[item.channel]} dot={false}>
                      {CHANNEL_LABELS[item.channel]}
                    </StatusBadge>
                    <span className="font-medium text-foreground">{item.count}</span>
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
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox size={14} />
            Inbox
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-blue px-1.5 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="compose" className="gap-2">
            <Send size={14} />
            Send Broadcast
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock size={14} />
            System Logs
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
                All
              </Button>
              <Button
                variant={inboxFilter === "unread" ? "default" : "outline"}
                size="sm"
                onClick={() => { setInboxFilter("unread"); setInboxPage(1); }}
                className="gap-1.5"
              >
                Unread
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
                Mark all as read
              </Button>
            )}
          </div>

          {/* Inbox List */}
          {loadingInbox ? (
            <LoadingSpinner label="Loading personal notifications..." />
          ) : inboxError ? (
            <ErrorState
              title="Failed to load notifications"
              message={inboxError instanceof Error ? inboxError.message : "Unable to load inbox notifications."}
              onRetry={() => queryClient.invalidateQueries({ queryKey: ["my-notifications"] })}
            />
          ) : myNotifications.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No notifications"
              description={inboxFilter === "unread" ? "You have no unread notifications." : "You have no notifications yet."}
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
                          isUnread ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        }`}>
                          <EventIcon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {isUnread && (
                              <span className="h-2 w-2 rounded-full bg-brand-blue shrink-0" title="Unread" />
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
                            title="Mark as read"
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
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground">
                    Page {inboxPagination.page} of {inboxPagination.pages} ({inboxPagination.total} total)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInboxPage((p) => Math.max(p - 1, 1))}
                      disabled={inboxPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInboxPage((p) => p + 1)}
                      disabled={inboxPage >= inboxPagination.pages}
                    >
                      Next
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
              <h2 className="mb-4 text-lg font-semibold text-foreground">Send Broadcast</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="mb-1 block text-sm font-medium text-foreground">
                    Title <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter notification title"
                    maxLength={200}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {title.length}/200 characters
                  </p>
                </div>

                <div>
                  <label htmlFor="message" className="mb-1 block text-sm font-medium text-foreground">
                    Message <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter notification message"
                    rows={6}
                    maxLength={1000}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {message.length}/1000 characters
                  </p>
                </div>

                <div>
                  <label htmlFor="audience" className="mb-1 block text-sm font-medium text-foreground">
                    Audience <span className="text-destructive">*</span>
                  </label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger id="audience" className="w-full">
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Users</SelectItem>
                      <SelectItem value="CITIZEN">Citizens Only</SelectItem>
                      <SelectItem value="EXPERT">Experts Only</SelectItem>
                      <SelectItem value="ADMIN">Admins Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Channels <span className="text-destructive">*</span>
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
                      <span className="text-sm text-foreground">In-App Notification</span>
                    </label>
                  </div>
                  {selectedChannels.length === 0 && (
                    <p className="mt-1 text-xs text-destructive">
                      Please select at least one channel
                    </p>
                  )}
                </div>

                {broadcastMutation.isSuccess && (
                  <div className="rounded-lg bg-success/10 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 text-success" />
                      <div>
                        <p className="text-sm font-medium text-success">
                          Broadcast sent successfully!
                        </p>
                        <p className="mt-1 text-sm text-success/80">
                          The notification has been queued and will be sent to {AUDIENCE_LABELS[audience]}.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {broadcastMutation.isError && (
                  <div className="rounded-lg bg-destructive/10 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 text-destructive" />
                      <div>
                        <p className="text-sm font-medium text-destructive">
                          Failed to send broadcast
                        </p>
                        <p className="mt-1 text-sm text-destructive/80">
                          {(broadcastMutation.error as any)?.response?.data?.message || "An error occurred"}
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
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Broadcast
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
                      Search
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by recipient, subject..."
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="w-full lg:w-48">
                    <label htmlFor="channel-filter" className="mb-1 block text-sm font-medium text-foreground">
                      Channel
                    </label>
                    <Select
                      value={channelFilter}
                      onValueChange={(v) => setChannelFilter(v as NotificationChannel | "ALL")}
                    >
                      <SelectTrigger id="channel-filter" className="w-full">
                        <SelectValue placeholder="All Channels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Channels</SelectItem>
                        <SelectItem value="EMAIL">Email</SelectItem>
                        <SelectItem value="PUSH">In-App</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full lg:w-48">
                    <label htmlFor="sent-filter" className="mb-1 block text-sm font-medium text-foreground">
                      Status
                    </label>
                    <Select
                      value={sentFilter}
                      onValueChange={(v) => setSentFilter(v as "ALL" | "SENT" | "UNSENT")}
                    >
                      <SelectTrigger id="sent-filter" className="w-full">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="SENT">Sent</SelectItem>
                        <SelectItem value="UNSENT">Unsent / Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSearch}>
                      <Filter className="h-4 w-4" />
                      Filter
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                      Reset
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              {loadingLogs ? (
                <LoadingSpinner label="Loading logs..." />
              ) : error ? (
                <ErrorState
                  title="Failed to load logs"
                  onRetry={() => queryClient.invalidateQueries({ queryKey: ["admin-notifications-logs"] })}
                />
              ) : logs.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="No notification logs found"
                  description="Try adjusting your filters or send a broadcast to see logs here."
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-border">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Timestamp
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Recipient
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Channel
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Event
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Actions
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
                                {CHANNEL_LABELS[log.channel]}
                              </StatusBadge>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {log.event.replace(/_/g, " ")}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              {log.sent ? (
                                <StatusBadge tone="success">Sent</StatusBadge>
                              ) : log.errorMsg ? (
                                <StatusBadge tone="destructive">Failed</StatusBadge>
                              ) : (
                                <StatusBadge tone="pending">Pending</StatusBadge>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary/80"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border px-6 py-3">
                      <div className="text-sm text-muted-foreground">
                        Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page + 1)}
                          disabled={page >= pagination.totalPages}
                        >
                          Next
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
    </div>
  );
}
