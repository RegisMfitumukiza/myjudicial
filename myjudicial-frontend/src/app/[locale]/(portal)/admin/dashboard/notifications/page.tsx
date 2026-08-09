"use client";

import { useState } from "react";
import {
  Bell,
  Mail,
  TrendingUp,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Users,
  BarChart3,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { format } from "date-fns";

// Types
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

// API functions
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

// Helper functions
const getChannelBadge = (channel: NotificationChannel) => {
  const configs: Record<NotificationChannel, { color: string; icon: any; label: string }> = {
    EMAIL: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Mail, label: "Email" },
    PUSH: { color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: Bell, label: "In-App" },
  };

  const config = configs[channel];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};

const getStatusBadge = (sent: boolean, errorMsg: string | null) => {
  if (sent) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle size={12} />
        Sent
      </span>
    );
  } else if (errorMsg) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <XCircle size={12} />
        Failed
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
        <Clock size={12} />
        Pending
      </span>
    );
  }
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "—";
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

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<NotificationChannel | "ALL">("ALL");
  const [sentFilter, setSentFilter] = useState<"ALL" | "SENT" | "FAILED" | "PENDING">("ALL");

  // Compose form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("ALL");
  const [selectedChannels, setSelectedChannels] = useState<NotificationChannel[]>(["EMAIL"]);

  // Fetch stats
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-notifications-stats"],
    queryFn: fetchStats,
  });

  // Fetch logs
  const { data: logsData, isLoading: loadingLogs, error } = useQuery({
    queryKey: ["admin-notifications-logs", page, searchQuery, channelFilter, sentFilter],
    queryFn: () => {
      let sentValue: boolean | undefined = undefined;
      if (sentFilter === "SENT") sentValue = true;
      if (sentFilter === "FAILED" || sentFilter === "PENDING") sentValue = false;

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

  // Send broadcast mutation
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Send broadcasts and view notification history
        </p>
      </div>

      {/* Statistics Cards */}
      {loadingStats ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Total Logs */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Logs</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalLogs.toLocaleString()}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Sent Today */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sent Today</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.sentToday.toLocaleString()}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* Sent This Week */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sent This Week</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.sentThisWeek.toLocaleString()}
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.successRate}%
                </p>
              </div>
              <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/30">
                <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Failed Recent */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed (7 days)</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.failedRecent.toLocaleString()}
                </p>
              </div>
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          {/* By Channel Breakdown */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">By Channel</p>
                <div className="mt-2 space-y-1">
                  {stats.byChannel.map((item) => (
                    <div key={item.channel} className="flex items-center gap-2 text-sm">
                      {getChannelBadge(item.channel)}
                      <span className="font-medium text-gray-900 dark:text-white">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/30">
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab("compose")}
            className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === "compose"
                ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Send size={16} />
              Compose
            </div>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock size={16} />
              History
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "compose" && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Send Broadcast</h2>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter notification title"
                maxLength={200}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {title.length}/200 characters
              </p>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter notification message"
                rows={6}
                maxLength={1000}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {message.length}/1000 characters
              </p>
            </div>

            {/* Audience */}
            <div>
              <label htmlFor="audience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Audience <span className="text-red-500">*</span>
              </label>
              <select
                id="audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500"
              >
                <option value="ALL">All Users</option>
                <option value="CITIZEN">Citizens Only</option>
                <option value="EXPERT">Experts Only</option>
                <option value="ADMIN">Admins Only</option>
              </select>
            </div>

            {/* Channels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Channels <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedChannels.includes("EMAIL")}
                    onChange={() => handleChannelToggle("EMAIL")}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <Mail size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedChannels.includes("PUSH")}
                    onChange={() => handleChannelToggle("PUSH")}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <Bell size={16} className="text-orange-600 dark:text-orange-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">In-App Notification</span>
                </label>
              </div>
              {selectedChannels.length === 0 && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  Please select at least one channel
                </p>
              )}
            </div>

            {/* Success Message */}
            {broadcastMutation.isSuccess && (
              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      Broadcast sent successfully!
                    </p>
                    <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                      The notification has been queued and will be sent to {AUDIENCE_LABELS[audience]}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {broadcastMutation.isError && (
              <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                      Failed to send broadcast
                    </p>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                      {(broadcastMutation.error as any)?.response?.data?.message || "An error occurred"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Send Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSend}
                disabled={
                  !title.trim() ||
                  !message.trim() ||
                  selectedChannels.length === 0 ||
                  broadcastMutation.isPending
                }
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-800"
              >
                {broadcastMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Broadcast
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by recipient, subject..."
                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="w-full lg:w-48">
                <label htmlFor="channel-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Channel
                </label>
                <select
                  id="channel-filter"
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value as any)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500"
                >
                  <option value="ALL">All Channels</option>
                  <option value="EMAIL">Email</option>
                  <option value="PUSH">In-App</option>
                </select>
              </div>

              <div className="w-full lg:w-48">
                <label htmlFor="sent-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  id="sent-filter"
                  value={sentFilter}
                  onChange={(e) => setSentFilter(e.target.value as any)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SENT">Sent</option>
                  <option value="FAILED">Failed</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                </button>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-800"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            {loadingLogs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">Failed to load logs</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  {(error as any)?.response?.data?.message || "An error occurred"}
                </p>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Bell className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">No notification logs found</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Try adjusting your filters or send a broadcast to see logs here.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Recipient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Channel
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Event
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {logs.map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {formatDate(log.sentAt || log.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {log.user ? `${log.user.firstName} ${log.user.lastName}` : "Unknown"}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400">{log.recipient}</div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            {getChannelBadge(log.channel)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {log.event.replace(/_/g, " ")}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            {getStatusBadge(log.sent, log.errorMsg)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            <button
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-700/50">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page >= pagination.totalPages}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
