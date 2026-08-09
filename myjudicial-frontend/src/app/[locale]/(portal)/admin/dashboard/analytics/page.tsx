"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Users,
  Briefcase,
  TrendingUp,
  DollarSign,
  Loader2,
  Star,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Activity,
  BarChart3,
  TrendingDown,
  MapPin,
  Filter,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  useGetAdminAnalyticsSummary,
  useGetAdminAnalyticsUsers,
  useGetAdminAnalyticsRevenue,
  useGetAdminAnalyticsExperts,
  useGetAdminAnalyticsBookings,
  useGetAdminAnalyticsReviews,
  useGetAdminAnalyticsCommunications,
  useGetAdminAnalyticsCompliance,
} from "@/api/generated";
import { apiFetch } from "@/lib/api/client";

const COLORS = {
  primary: "#0b2545",
  secondary: "#0b2545",
  tertiary: "#000000",
  danger: "#000000",
  success: "#0b2545",
  warning: "#000000",
  info: "#0b2545",
  gray: "#000000",
};

const PIE_COLORS = ["#0b2545", "#000000", "#ffffff"];

// Types
type TimePeriod = "today" | "7days" | "30days" | "90days" | "year";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
}

const StatCard = ({ title, value, icon: Icon, trend, color = "blue" }: StatCardProps) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">vs last period</span>
            </div>
          )}
        </div>
        <div className={`rounded-full p-3 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<TimePeriod>("30days");
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [geoData, setGeoData] = useState<any>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [bookingsComp, setBookingsComp] = useState<any>(null);
  const [revenueComp, setRevenueComp] = useState<any>(null);
  const [compLoading, setCompLoading] = useState(false);

  const dateParams = period === ("custom" as TimePeriod) && startDate && endDate
    ? { startDate, endDate }
    : { period };

  // Fetch analytics data
  const { data: summaryRes, isLoading: summaryLoading } = useGetAdminAnalyticsSummary();
  const { data: usersRes, isLoading: usersLoading } = useGetAdminAnalyticsUsers(dateParams);
  const { data: revenueRes, isLoading: revenueLoading } = useGetAdminAnalyticsRevenue(dateParams);
  const { data: expertsRes, isLoading: expertsLoading } = useGetAdminAnalyticsExperts();
  const { data: bookingsRes, isLoading: bookingsLoading } = useGetAdminAnalyticsBookings(dateParams);
  const { data: reviewsRes, isLoading: reviewsLoading } = useGetAdminAnalyticsReviews(dateParams);
  const { data: commsRes, isLoading: commsLoading } = useGetAdminAnalyticsCommunications(dateParams);
  const { data: complianceRes, isLoading: complianceLoading } = useGetAdminAnalyticsCompliance();

  const summary = summaryRes?.status === 200 ? summaryRes.data.data : null;
  const revenue = revenueRes?.status === 200 ? revenueRes.data.data : null;
  const bookings = bookingsRes?.status === 200 ? bookingsRes.data.data : null;
  const users = (usersRes as any)?.data?.data ?? null;
  const experts = (expertsRes as any)?.data?.data ?? null;
  const reviews = (reviewsRes as any)?.data?.data ?? null;
  const comms = (commsRes as any)?.data?.data ?? null;
  const compliance = (complianceRes as any)?.data?.data ?? null;

  // Process data for charts
  const userGrowthData = useMemo(() => {
    if (!users?.timeSeries) return [];
    return users.timeSeries.map((item: any) => ({
      date: item.date,
      users: item.count,
    }));
  }, [users]);

  const revenueChartData = useMemo(() => {
    if (!revenue?.timeSeries) return [];
    return revenue.timeSeries.map((item: any) => ({
      date: item.date,
      revenue: item.totalRevenue,
      platformFees: item.platformFees,
      expertPayouts: item.expertPayouts,
    }));
  }, [revenue]);

  const bookingStatusData = useMemo(() => {
    if (!(bookings as any)?.summary) return [];
    const s = (bookings as any).summary;
    return [
      { name: "Completed", value: s.completed || 0, color: COLORS.success },
      { name: "Pending", value: s.pending || 0, color: COLORS.warning },
      { name: "Cancelled", value: s.cancelled || 0, color: COLORS.danger },
    ].filter((item) => item.value > 0);
  }, [bookings]);

  const communicationChannelsData = comms?.byChannel?.map((item: any, index: number) => ({
    name: item.channel,
    value: item.count,
    color: PIE_COLORS[index % PIE_COLORS.length],
  })) || [];

  const topExperts = experts?.topRated?.slice(0, 10).map((item: any) => ({
    name: item.displayName,
    rating: item.averageRating || 0,
    reviews: item.reviewCount || 0,
    bookings: item.bookingCount || 0,
  })) || [];

  // Booking volume bar chart data
  const bookingVolumeData = useMemo(() => {
    if (!bookings?.timeSeries) return [];
    return bookings.timeSeries.map((item: any) => ({
      date: item.date,
      completed: item.completed || 0,
      pending: item.pending || 0,
      cancelled: item.cancelled || 0,
    }));
  }, [bookings]);

  // Expert revenue breakdown
  const expertRevenueData = experts?.topRated?.slice(0, 5).map((item: any) => ({
    name: item.displayName,
    revenue: item.totalRevenue || 0,
    bookings: item.bookingCount || 0,
  })) || [];

  // Comparison data
  useEffect(() => {
    let cancelled = false;
    setCompLoading(true);
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (!startDate && !endDate && period) params.set("period", period);
    const query = params.toString() ? `?${params}` : "";

    Promise.all([
      apiFetch(`/admin/analytics/compare/bookings${query}`),
      apiFetch(`/admin/analytics/compare/revenue${query}`),
    ])
      .then(async ([bRes, rRes]) => {
        if (cancelled) return;
        const bData: any = bRes as any;
        const rData: any = rRes as any;
        if (bData?.data) setBookingsComp(bData.data);
        if (rData?.data) setRevenueComp(rData.data);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setCompLoading(false); });

    return () => { cancelled = true; };
  }, [period, startDate, endDate]);

  // Geographic distribution
  useEffect(() => {
    if (!geoData && !geoLoading) {
      setGeoLoading(true);
      apiFetch("/admin/analytics/geographic")
        .then((res: any) => {
          setGeoData(res?.data || null);
        })
        .catch(() => setGeoData(null))
        .finally(() => setGeoLoading(false));
    }
  }, [geoData, geoLoading]);

  const geographicData = useMemo(() => {
    if (!geoData?.cities) return [];
    return geoData.cities.map((c: any) => ({
      region: c.city,
      experts: c.experts,
      percentage: c.percentage,
    }));
  }, [geoData]);

  const isLoading =
    summaryLoading ||
    usersLoading ||
    revenueLoading ||
    expertsLoading ||
    bookingsLoading ||
    reviewsLoading ||
    commsLoading ||
    complianceLoading;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const hasError = !summary && !users && !revenue && !experts && !bookings && !reviews && !comms && !compliance;

  if (hasError && !isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Failed to load analytics</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Unable to fetch analytics data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Platform Analytics</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Comprehensive insights and metrics across the platform
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <select
              value={period}
              onChange={(e) => {
                const value = e.target.value;
                if (value !== "custom") {
                  setPeriod(value as TimePeriod);
                  setShowCustomDate(false);
                  setStartDate("");
                  setEndDate("");
                } else {
                  setShowCustomDate(true);
                }
              }}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {/* Custom Date Range Button */}
          <button
            onClick={() => setShowCustomDate(!showCustomDate)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Filter className="h-4 w-4" />
            Custom Range
          </button>

        </div>
      </div>

      {/* Custom Date Range Panel */}
      {showCustomDate && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Custom Date Range</h3>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              onClick={() => {
                setPeriod("custom" as TimePeriod);
                setShowCustomDate(false);
              }}
              disabled={!startDate || !endDate}
              className="rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={summary?.platform?.totalUsers || 0}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Experts"
          value={summary?.platform?.activeExperts || 0}
          icon={Briefcase}
          color="green"
        />
        <StatCard
          title="Total Bookings"
          value={(bookings as any)?.summary?.total || 0}
          icon={Calendar}
          color="purple"
        />
        <StatCard
          title="Total Revenue"
          value={`RWF ${((revenue?.totals?.totalRevenue || 0) / 1000).toFixed(1)}k`}
          icon={DollarSign}
          color="orange"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* User Growth Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">User Growth</h3>
          {userGrowthData.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No data available</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke={COLORS.primary}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Revenue Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Revenue Trends</h3>
          {revenueChartData.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No data available</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    name="Total Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="platformFees"
                    stroke={COLORS.secondary}
                    strokeWidth={2}
                    name="Platform Fees"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Booking Status Distribution */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Booking Status Distribution
          </h3>
          {bookingStatusData.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No data available</p>
            </div>
          ) : (
            <div className="flex h-64 items-center">
              <div className="w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bookingStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label
                    >
                      {bookingStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-3">
                {bookingStatusData.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.value.toLocaleString()} bookings
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Communication Channels */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Communication Channels
          </h3>
          {communicationChannelsData.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No data available</p>
            </div>
          ) : (
            <div className="flex h-64 items-center">
              <div className="w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={communicationChannelsData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label
                    >
                      {communicationChannelsData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-3">
                {communicationChannelsData.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.value.toLocaleString()} messages
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Period Comparison Bar Charts */}
      {!compLoading && (bookingsComp || revenueComp) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {bookingsComp?.data?.comparisons && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Booking Comparison (Current vs Previous Period)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: "Total", current: bookingsComp.data.comparisons.totalBookings?.current || 0, previous: bookingsComp.data.comparisons.totalBookings?.previous || 0 },
                    { name: "Completed", current: bookingsComp.data.comparisons.completedBookings?.current || 0, previous: bookingsComp.data.comparisons.completedBookings?.previous || 0 },
                  ].filter(d => d.current > 0 || d.previous > 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="current" fill="#0b2545" name="Current Period" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="previous" fill="#000000" name="Previous Period" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {revenueComp?.data?.comparisons && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Revenue Comparison (RWF '000)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: "Revenue", current: Math.round((revenueComp.data.comparisons.totalRevenue?.current || 0) / 1000), previous: Math.round((revenueComp.data.comparisons.totalRevenue?.previous || 0) / 1000) },
                    { name: "Fees", current: Math.round((revenueComp.data.comparisons.platformFees?.current || 0) / 1000), previous: Math.round((revenueComp.data.comparisons.platformFees?.previous || 0) / 1000) },
                  ].filter(d => d.current > 0 || d.previous > 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="current" fill="#0b2545" name="Current Period" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="previous" fill="#000000" name="Previous Period" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts Row 3 - Bar Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Booking Volume Bar Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Booking Volume Trends
          </h3>
          {bookingVolumeData.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No data available</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="completed" fill={COLORS.success} name="Completed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" fill={COLORS.warning} name="Pending" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cancelled" fill={COLORS.danger} name="Cancelled" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Expert Revenue Bar Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Top Experts by Revenue
          </h3>
          {expertRevenueData.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No data available</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expertRevenueData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={12} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any) => `RWF ${value.toLocaleString()}`}
                  />
                  <Bar dataKey="revenue" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
          Geographic Distribution (Rwanda)
        </h3>
        
        {geographicData.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No geographic data available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Distribution Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={geographicData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" fontSize={12} />
                  <YAxis type="category" dataKey="region" stroke="#6b7280" fontSize={12} width={100} />
                  <Tooltip formatter={(value: any) => [`${value} experts`, "Experts"]} />
                  <Bar dataKey="experts" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Geographic Stats */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Total Regions</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-blue-900 dark:text-blue-300">{geographicData.length}</p>
                </div>
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-900 dark:text-green-300">Top City</span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-green-900 dark:text-green-300">
                    {geographicData[0]?.region || "N/A"}
                  </p>
                </div>
              </div>

              {/* Regional Breakdown */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">City Breakdown</h4>
                {geographicData.map((region: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{region.region}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {region.experts} experts
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {region.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
              <Star className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {reviews?.average?.toFixed(1) || "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(bookings as any)?.summary?.completionRate
                  ? `${(bookings as any).summary.completionRate.toFixed(1)}%`
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
              <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {comms?.totalSessions || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/30">
              <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Compliance Issues</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(compliance?.expired || 0) + (compliance?.expiringSoon || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Experts Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Performing Experts</h3>
        </div>
        <div className="overflow-x-auto">
          {topExperts.length === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No expert data available</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Expert
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Reviews
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Bookings
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {topExperts.map((expert: any, index: number) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center justify-center">
                        {index < 3 ? (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-sm font-bold text-white">
                            {index + 1}
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {index + 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                          <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {expert.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {expert.rating.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {expert.reviews.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {expert.bookings.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Platform Fees</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                RWF {((revenue?.totals?.platformFees || 0) / 1000).toFixed(1)}k
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
              <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expert Payouts</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                RWF {((revenue?.totals?.expertPayouts || 0) / 1000).toFixed(1)}k
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Escrow Locked</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                RWF {((revenue?.totals?.escrowLocked || 0) / 1000).toFixed(1)}k
              </p>
            </div>
            <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/30">
              <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Overview */}
      {compliance && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Compliance Status
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Verified</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {compliance.verified || 0}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full bg-yellow-100 p-2 dark:bg-yellow-900/30">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Expiring Soon</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {compliance.expiringSoon || 0}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/30">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Expired</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {compliance.expired || 0}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gray-100 p-2 dark:bg-gray-700">
                <AlertCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {compliance.pending || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
