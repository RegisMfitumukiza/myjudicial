"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Clock,
  Ban,
  CheckCircle,
  XCircle,
  Calendar,
  Mail,
  Eye,
  TrendingUp,
  Users,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/components/ui/tabs";
import {
  PageHeader,
  StatCard,
  EmptyState,
  LoadingSpinner,
  ErrorState,
  StatusBadge,
} from "@/shared/components/dashboard";

interface ComplianceStats {
  totalExperts: number;
  verifiedExperts: number;
  expiringCount: number;
  expiredCount: number;
  suspendedCount: number;
  noExpirySetCount: number;
  complianceRate: number;
}

interface Expert {
  id: string;
  expertId: string;
  fullName: string;
  email: string;
  phone: string | null;
  barNumber: string | null;
  credentialsExpiry: string | null;
  daysUntilExpiry?: number | null;
  daysOverdue?: number | null;
  accountStatus?: string;
  specialties: string[];
  officeAddress: string | null;
  suspendedAt?: string;
}

interface ExpertsResponse {
  data: Expert[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const fetchStats = async (): Promise<{ data: ComplianceStats }> => {
  return apiFetch("/admin/compliance/overview");
};

const fetchExpiringExperts = async (page: number, limit: number, daysThreshold: number): Promise<ExpertsResponse> => {
  return apiFetch(`/admin/compliance/expiring?page=${page}&limit=${limit}&daysThreshold=${daysThreshold}`);
};

const fetchExpiredExperts = async (page: number, limit: number): Promise<ExpertsResponse> => {
  return apiFetch(`/admin/compliance/expired?page=${page}&limit=${limit}`);
};

const fetchSuspendedExperts = async (page: number, limit: number): Promise<ExpertsResponse> => {
  return apiFetch(`/admin/compliance/suspended?page=${page}&limit=${limit}`);
};

const sendWarningEmail = async (expertId: string) => {
  return apiFetch(`/admin/compliance/${expertId}/send-warning`, { method: "POST" });
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "Not set";
  try {
    return format(new Date(dateString), "MMM dd, yyyy");
  } catch {
    return dateString;
  }
};

const getUrgencyTone = (days: number | null | undefined): "destructive" | "warning" | "neutral" => {
  if (days === null || days === undefined) return "neutral";
  if (days <= 7) return "destructive";
  if (days <= 15) return "warning";
  return "neutral";
};

const getUrgencyLabel = (days: number | null | undefined): string => {
  if (days === null || days === undefined) return "N/A";
  return `${days} days`;
};

function ExpertTable({
  experts,
  pagination,
  isLoading,
  activeTab,
  sendWarningMutation,
  onPageChange,
}: {
  experts: Expert[];
  pagination: ExpertsResponse["pagination"] | undefined;
  isLoading: boolean;
  activeTab: "expiring" | "expired" | "suspended";
  sendWarningMutation: { mutate: (id: string) => void; isPending: boolean };
  onPageChange: (page: number) => void;
}) {
  if (isLoading) {
    return <LoadingSpinner label={`Loading ${activeTab} experts...`} />;
  }

  return (
    <>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4">Expert</th>
                <th className="px-6 py-4">Bar Number</th>
                <th className="px-6 py-4">
                  {activeTab === "suspended" ? "Suspended" : "Credentials Expiry"}
                </th>
                <th className="px-6 py-4">
                  {activeTab === "expiring" && "Days Until Expiry"}
                  {activeTab === "expired" && "Days Overdue"}
                  {activeTab === "suspended" && "Status"}
                </th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {experts.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={activeTab === "suspended" ? Ban : Calendar}
                      title={
                        activeTab === "expiring"
                          ? "No experts with expiring credentials"
                          : activeTab === "expired"
                            ? "No experts with expired credentials"
                            : "No suspended experts"
                      }
                    />
                  </td>
                </tr>
              ) : (
                experts.map((expert) => (
                  <tr key={expert.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          {expert.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{expert.fullName}</p>
                          <p className="text-xs text-muted-foreground">{expert.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-foreground">{expert.barNumber || "N/A"}</span>
                    </td>
                    <td className="px-6 py-4">
                      {activeTab === "suspended" ? (
                        <span className="text-foreground">
                          {expert.suspendedAt ? formatDistanceToNow(new Date(expert.suspendedAt), { addSuffix: true }) : "N/A"}
                        </span>
                      ) : (
                        <span className="text-foreground">{formatDate(expert.credentialsExpiry)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {activeTab === "expiring" && (
                        <StatusBadge tone={getUrgencyTone(expert.daysUntilExpiry)}>
                          {getUrgencyLabel(expert.daysUntilExpiry)}
                        </StatusBadge>
                      )}
                      {activeTab === "expired" && (
                        <StatusBadge tone="destructive">
                          {getUrgencyLabel(expert.daysOverdue)}
                        </StatusBadge>
                      )}
                      {activeTab === "suspended" && (
                        <StatusBadge tone="destructive">
                          <Ban size={12} />
                          Suspended
                        </StatusBadge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {(activeTab === "expiring" || activeTab === "expired") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendWarningMutation.mutate(expert.id)}
                            disabled={sendWarningMutation.isPending}
                          >
                            <Mail size={14} />
                            Send Warning
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm">
                          <Eye size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState<"expiring" | "expired" | "suspended">("expiring");
  const [expiringPage, setExpiringPage] = useState(1);
  const [expiredPage, setExpiredPage] = useState(1);
  const [suspendedPage, setSuspendedPage] = useState(1);
  const [daysThreshold, setDaysThreshold] = useState(30);

  const { data: statsData, isLoading: loadingStats, isError: statsError } = useQuery({
    queryKey: ["admin-compliance-stats"],
    queryFn: fetchStats,
  });

  const { data: expiringData, isLoading: loadingExpiring, isError: expiringError } = useQuery({
    queryKey: ["admin-compliance-expiring", expiringPage, daysThreshold],
    queryFn: () => fetchExpiringExperts(expiringPage, 20, daysThreshold),
    enabled: activeTab === "expiring",
  });

  const { data: expiredData, isLoading: loadingExpired, isError: expiredError } = useQuery({
    queryKey: ["admin-compliance-expired", expiredPage],
    queryFn: () => fetchExpiredExperts(expiredPage, 20),
    enabled: activeTab === "expired",
  });

  const { data: suspendedData, isLoading: loadingSuspended, isError: suspendedError } = useQuery({
    queryKey: ["admin-compliance-suspended", suspendedPage],
    queryFn: () => fetchSuspendedExperts(suspendedPage, 20),
    enabled: activeTab === "suspended",
  });

  const sendWarningMutation = useMutation({
    mutationFn: (expertId: string) => sendWarningEmail(expertId),
    onSuccess: () => {
      toast.success("Warning email sent successfully");
    },
    onError: () => {
      toast.error("Failed to send warning email");
    },
  });

  const stats = statsData?.data;

  if (loadingStats) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <LoadingSpinner label="Loading compliance data..." />
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <PageHeader
          title="Compliance Dashboard"
          description="Monitor expert credentials and compliance status"
        />
        <ErrorState
          title="Failed to load compliance data"
          message="Unable to fetch compliance overview. Please try again later."
        />
      </div>
    );
  }

  const expiringExperts = expiringData?.data ?? [];
  const expiredExperts = expiredData?.data ?? [];
  const suspendedExperts = suspendedData?.data ?? [];

  const handlePageChange = (newPage: number) => {
    if (activeTab === "expiring") setExpiringPage(newPage);
    else if (activeTab === "expired") setExpiredPage(newPage);
    else setSuspendedPage(newPage);
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Compliance Dashboard"
        description="Monitor expert credentials and compliance status"
      />

      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatCard
            label="Total Experts"
            value={stats.totalExperts}
            icon={Users}
          />
          <StatCard
            label="Verified"
            value={stats.verifiedExperts}
            icon={CheckCircle}
          />
          <StatCard
            label="Expiring Soon"
            value={stats.expiringCount}
            icon={AlertTriangle}
          />
          <StatCard
            label="Expired"
            value={stats.expiredCount}
            icon={XCircle}
          />
          <StatCard
            label="Suspended"
            value={stats.suspendedCount}
            icon={Ban}
          />
          <StatCard
            label="Compliance Rate"
            value={`${stats.complianceRate.toFixed(1)}%`}
            icon={TrendingUp}
          />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "expiring" | "expired" | "suspended")}>
        <TabsList variant="line">
          <TabsTrigger value="expiring">
            <AlertTriangle size={14} />
            Expiring Soon ({stats?.expiringCount ?? 0})
          </TabsTrigger>
          <TabsTrigger value="expired">
            <XCircle size={14} />
            Expired ({stats?.expiredCount ?? 0})
          </TabsTrigger>
          <TabsTrigger value="suspended">
            <Ban size={14} />
            Suspended ({stats?.suspendedCount ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expiring">
          {activeTab === "expiring" && (
            <>
              <Card>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-muted-foreground" />
                    <label className="text-sm font-medium text-foreground">Show expiring within:</label>
                    <Select
                      value={String(daysThreshold)}
                      onValueChange={(v) => {
                        setDaysThreshold(Number(v));
                        setExpiringPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {expiringError ? (
                <ErrorState
                  title="Failed to load expiring experts"
                  message="Please try adjusting your filters or try again later."
                />
              ) : (
                <Card>
                  <ExpertTable
                    experts={expiringExperts}
                    pagination={expiringData?.pagination}
                    isLoading={loadingExpiring}
                    activeTab="expiring"
                    sendWarningMutation={sendWarningMutation}
                    onPageChange={handlePageChange}
                  />
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="expired">
          {activeTab === "expired" && (
            expiredError ? (
              <ErrorState
                title="Failed to load expired experts"
                message="Please try adjusting your filters or try again later."
              />
            ) : (
              <Card>
                <ExpertTable
                  experts={expiredExperts}
                  pagination={expiredData?.pagination}
                  isLoading={loadingExpired}
                  activeTab="expired"
                  sendWarningMutation={sendWarningMutation}
                  onPageChange={handlePageChange}
                />
              </Card>
            )
          )}
        </TabsContent>

        <TabsContent value="suspended">
          {activeTab === "suspended" && (
            suspendedError ? (
              <ErrorState
                title="Failed to load suspended experts"
                message="Please try adjusting your filters or try again later."
              />
            ) : (
              <Card>
                <ExpertTable
                  experts={suspendedExperts}
                  pagination={suspendedData?.pagination}
                  isLoading={loadingSuspended}
                  activeTab="suspended"
                  sendWarningMutation={sendWarningMutation}
                  onPageChange={handlePageChange}
                />
              </Card>
            )
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
