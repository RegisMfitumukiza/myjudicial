"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Users,
  Briefcase,
  DollarSign,
  Star,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Activity,
  BarChart3,
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
import { PageHeader } from "@/shared/components/dashboard/page-header";
import { StatCard } from "@/shared/components/dashboard/stat-card";
import { LoadingSpinner } from "@/shared/components/dashboard/loading";
import { ErrorState } from "@/shared/components/dashboard/error-state";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/components/ui/select";

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--muted-foreground))",
  tertiary: "hsl(var(--foreground))",
  danger: "hsl(var(--destructive))",
  success: "hsl(var(--primary))",
  warning: "hsl(var(--warning))",
  info: "hsl(var(--primary))",
  gray: "hsl(var(--muted-foreground))",
};

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
];

type TimePeriod = "today" | "7days" | "30days" | "90days" | "year";

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--popover-foreground))",
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

  const dateParams =
    period === ("custom" as TimePeriod) && startDate && endDate
      ? { startDate, endDate }
      : { period };

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

  const communicationChannelsData =
    comms?.byChannel?.map((item: any, index: number) => ({
      name: item.channel,
      value: item.count,
      color: PIE_COLORS[index % PIE_COLORS.length],
    })) || [];

  const topExperts =
    experts?.topRated?.slice(0, 10).map((item: any) => ({
      name: item.displayName,
      rating: item.averageRating || 0,
      reviews: item.reviewCount || 0,
      bookings: item.bookingCount || 0,
    })) || [];

  const bookingVolumeData = useMemo(() => {
    if (!bookings?.timeSeries) return [];
    return bookings.timeSeries.map((item: any) => ({
      date: item.date,
      completed: item.completed || 0,
      pending: item.pending || 0,
      cancelled: item.cancelled || 0,
    }));
  }, [bookings]);

  const expertRevenueData =
    experts?.topRated?.slice(0, 5).map((item: any) => ({
      name: item.displayName,
      revenue: item.totalRevenue || 0,
      bookings: item.bookingCount || 0,
    })) || [];

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
      .finally(() => {
        if (!cancelled) setCompLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [period, startDate, endDate]);

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
      <div className="space-y-6 p-6 lg:p-8">
        <LoadingSpinner label="Loading analytics..." />
      </div>
    );
  }

  const hasError =
    !summary && !users && !revenue && !experts && !bookings && !reviews && !comms && !compliance;

  if (hasError && !isLoading) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <PageHeader
          title="Platform Analytics"
          description="Comprehensive insights and metrics across the platform"
        />
        <ErrorState
          title="Failed to load analytics"
          message="Unable to fetch analytics data. Please try again later."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Platform Analytics"
        description="Comprehensive insights and metrics across the platform"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={period}
              onValueChange={(value) => {
                setPeriod(value as TimePeriod);
                setShowCustomDate(false);
                setStartDate("");
                setEndDate("");
              }}
            >
              <SelectTrigger className="w-[160px]">
                <Calendar className="mr-1.5 h-4 w-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomDate(!showCustomDate)}
            >
              <Filter className="h-4 w-4" />
              Custom Range
            </Button>
          </div>
        }
      />

      {showCustomDate && (
        <Card>
          <CardContent>
            <h3 className="mb-3 text-sm font-medium text-foreground">Custom Date Range</h3>
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[200px] flex-1">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="min-w-[200px] flex-1">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="default"
                onClick={() => {
                  setPeriod("custom" as TimePeriod);
                  setShowCustomDate(false);
                }}
                disabled={!startDate || !endDate}
              >
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={summary?.platform?.totalUsers?.toLocaleString() || "0"}
          icon={Users}
        />
        <StatCard
          label="Active Experts"
          value={summary?.platform?.activeExperts?.toLocaleString() || "0"}
          icon={Briefcase}
        />
        <StatCard
          label="Total Bookings"
          value={(bookings as any)?.summary?.total?.toLocaleString() || "0"}
          icon={Calendar}
        />
        <StatCard
          label="Total Revenue"
          value={`RWF ${((revenue?.totals?.totalRevenue || 0) / 1000).toFixed(1)}k`}
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            {userGrowthData.length === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-sm text-muted-foreground">No data available</p>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowthData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorUsers)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueChartData.length === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-sm text-muted-foreground">No data available</p>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueChartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="Total Revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="platformFees"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      name="Platform Fees"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingStatusData.length === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-sm text-muted-foreground">No data available</p>
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
                        <p className="text-sm font-medium text-foreground">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.value.toLocaleString()} bookings
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Communication Channels</CardTitle>
          </CardHeader>
          <CardContent>
            {communicationChannelsData.length === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-sm text-muted-foreground">No data available</p>
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
                        {communicationChannelsData.map(
                          (entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          )
                        )}
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
                        <p className="text-sm font-medium text-foreground">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.value.toLocaleString()} messages
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!compLoading && (bookingsComp || revenueComp) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {bookingsComp?.data?.comparisons && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Booking Comparison (Current vs Previous Period)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: "Total",
                          current:
                            bookingsComp.data.comparisons.totalBookings
                              ?.current || 0,
                          previous:
                            bookingsComp.data.comparisons.totalBookings
                              ?.previous || 0,
                        },
                        {
                          name: "Completed",
                          current:
                            bookingsComp.data.comparisons.completedBookings
                              ?.current || 0,
                          previous:
                            bookingsComp.data.comparisons.completedBookings
                              ?.previous || 0,
                        },
                      ].filter((d) => d.current > 0 || d.previous > 0)}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="name"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Bar
                        dataKey="current"
                        fill="hsl(var(--primary))"
                        name="Current Period"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="previous"
                        fill="hsl(var(--muted))"
                        name="Previous Period"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          {revenueComp?.data?.comparisons && (
            <Card>
              <CardHeader>
                <CardTitle>Revenue Comparison (RWF &apos;000)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: "Revenue",
                          current: Math.round(
                            (revenueComp.data.comparisons.totalRevenue
                              ?.current || 0) / 1000
                          ),
                          previous: Math.round(
                            (revenueComp.data.comparisons.totalRevenue
                              ?.previous || 0) / 1000
                          ),
                        },
                        {
                          name: "Fees",
                          current: Math.round(
                            (revenueComp.data.comparisons.platformFees
                              ?.current || 0) / 1000
                          ),
                          previous: Math.round(
                            (revenueComp.data.comparisons.platformFees
                              ?.previous || 0) / 1000
                          ),
                        },
                      ].filter((d) => d.current > 0 || d.previous > 0)}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="name"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Bar
                        dataKey="current"
                        fill="hsl(var(--primary))"
                        name="Current Period"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="previous"
                        fill="hsl(var(--muted))"
                        name="Previous Period"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking Volume Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingVolumeData.length === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-sm text-muted-foreground">No data available</p>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookingVolumeData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar
                      dataKey="completed"
                      fill={COLORS.success}
                      name="Completed"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="pending"
                      fill={COLORS.warning}
                      name="Pending"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="cancelled"
                      fill={COLORS.danger}
                      name="Cancelled"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Experts by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {expertRevenueData.length === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-sm text-muted-foreground">No data available</p>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expertRevenueData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: any) =>
                        [`RWF ${value.toLocaleString()}`, "Revenue"]
                      }
                    />
                    <Bar
                      dataKey="revenue"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Geographic Distribution (Rwanda)</CardTitle>
        </CardHeader>
        <CardContent>
          {geographicData.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No geographic data available
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={geographicData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      type="category"
                      dataKey="region"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: any) => [`${value} experts`, "Experts"]}
                    />
                    <Bar
                      dataKey="experts"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-primary/10 p-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-primary">
                        Total Regions
                      </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-primary">
                      {geographicData.length}
                    </p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-4">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-primary">
                        Top City
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-bold text-primary">
                      {geographicData[0]?.region || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">
                    City Breakdown
                  </h4>
                  {geographicData.map((region: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor:
                              PIE_COLORS[index % PIE_COLORS.length],
                          }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {region.region}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          {region.experts} experts
                        </span>
                        <span className="text-muted-foreground">
                          {region.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Avg Rating"
          value={reviews?.average?.toFixed(1) || "N/A"}
          icon={Star}
        />
        <StatCard
          label="Completion Rate"
          value={
            (bookings as any)?.summary?.completionRate
              ? `${(bookings as any).summary.completionRate.toFixed(1)}%`
              : "N/A"
          }
          icon={CheckCircle}
        />
        <StatCard
          label="Active Sessions"
          value={comms?.totalSessions?.toLocaleString() || "0"}
          icon={Activity}
        />
        <StatCard
          label="Compliance Issues"
          value={((compliance?.expired || 0) + (compliance?.expiringSoon || 0)).toString()}
          icon={AlertCircle}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Performing Experts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {topExperts.length === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No expert data available
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Expert
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Reviews
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Bookings
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topExperts.map((expert: any, index: number) => (
                    <tr
                      key={index}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center justify-center">
                          {index < 3 ? (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                              {index + 1}
                            </div>
                          ) : (
                            <span className="text-sm font-medium text-muted-foreground">
                              {index + 1}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Briefcase className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {expert.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-primary text-primary" />
                          <span className="text-sm font-medium text-foreground">
                            {expert.rating.toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                        {expert.reviews.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                        {expert.bookings.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <StatCard
          label="Platform Fees"
          value={`RWF ${((revenue?.totals?.platformFees || 0) / 1000).toFixed(1)}k`}
          icon={BarChart3}
        />
        <StatCard
          label="Expert Payouts"
          value={`RWF ${((revenue?.totals?.expertPayouts || 0) / 1000).toFixed(1)}k`}
          icon={DollarSign}
        />
        <StatCard
          label="Escrow Locked"
          value={`RWF ${((revenue?.totals?.escrowLocked || 0) / 1000).toFixed(1)}k`}
          icon={Clock}
        />
      </div>

      {compliance && (
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Verified</p>
                  <p className="text-lg font-bold text-foreground">
                    {compliance.verified || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-full bg-warning/15 p-2">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Expiring Soon
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {compliance.expiringSoon || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-full bg-destructive/10 p-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expired</p>
                  <p className="text-lg font-bold text-foreground">
                    {compliance.expired || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-full bg-muted p-2">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-lg font-bold text-foreground">
                    {compliance.pending || 0}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
