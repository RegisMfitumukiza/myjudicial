"use client";

import { useState } from "react";
import {
  Users,
  UserCheck,
  Briefcase,
  Shield,
  Search,
  Filter,
  Trash2,
  Mail,
  Phone,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/providers/auth-provider";

import { PageHeader } from "@/shared/components/dashboard/page-header";
import { StatCard } from "@/shared/components/dashboard/stat-card";
import { StatusBadge, type StatusTone } from "@/shared/components/dashboard/status-badge";
import { TableSkeleton } from "@/shared/components/dashboard/loading";
import { ErrorState } from "@/shared/components/dashboard/error-state";
import { EmptyState } from "@/shared/components/dashboard/empty-state";
import { UserAvatar } from "@/shared/components/expert-avatar";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
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
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";

// Types
type UserRole = "CITIZEN" | "EXPERT" | "ADMIN";
type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";

interface UserStats {
  totalUsers: number;
  byRole: {
    citizens: number;
    experts: number;
    admins: number;
  };
  byStatus: {
    active: number;
    inactive: number;
  };
}

interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  accountStatus: AccountStatus;
  avatarUrl?: string | null;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  isExpert: boolean;
  expertVerified: boolean;
  barNumber: string | null;
  specialties: string[];
  totalBookings: number;
}

interface UsersResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API functions
const fetchStats = async (): Promise<{ data: UserStats }> => {
  return apiFetch("/admin/users/stats");
};

const fetchUsers = async (params: {
  page?: number;
  limit?: number;
  role?: UserRole;
  accountStatus?: AccountStatus;
  search?: string;
}): Promise<UsersResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.role) queryParams.append("role", params.role);
  if (params.accountStatus) queryParams.append("accountStatus", params.accountStatus);
  if (params.search) queryParams.append("search", params.search);

  return apiFetch(`/admin/users?${queryParams.toString()}`);
};

const updateUserStatus = async (userId: string, status: AccountStatus, reason?: string) => {
  return apiFetch(`/admin/users/${userId}/status`, { method: "PATCH", body: { status, reason } });
};

const deleteUser = async (userId: string, reason: string) => {
  return apiFetch(`/admin/users/${userId}`, { method: "DELETE", body: { reason } });
};

// Helper functions
const getRoleTone = (role: UserRole): StatusTone => {
  const map: Record<UserRole, StatusTone> = {
    CITIZEN: "info",
    EXPERT: "active",
    ADMIN: "warning",
  };
  return map[role];
};

const getStatusTone = (status: AccountStatus): StatusTone => {
  const map: Record<AccountStatus, StatusTone> = {
    ACTIVE: "active",
    INACTIVE: "neutral",
    SUSPENDED: "destructive",
    DELETED: "neutral",
  };
  return map[status];
};

export default function UsersPage() {
  const t = useTranslations("admin.users");
  const locale = useLocale();
  const { user: currentAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "ALL">("ALL");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionReason, setActionReason] = useState("");
  const [newStatus, setNewStatus] = useState<AccountStatus>("INACTIVE");

  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      CITIZEN: t("citizens"),
      EXPERT: t("experts"),
      ADMIN: t("admins"),
    };
    return labels[role] ?? role;
  };

  const getStatusLabel = (status: AccountStatus) => {
    const labels: Record<AccountStatus, string> = {
      ACTIVE: t("active"),
      INACTIVE: t("inactive"),
      SUSPENDED: t("suspended"),
      DELETED: t("deleted"),
    };
    return labels[status] ?? status;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Fetch stats
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-users-stats"],
    queryFn: fetchStats,
  });

  // Fetch users
  const { data: usersData, isLoading: loadingUsers, error } = useQuery({
    queryKey: ["admin-users", page, searchQuery, roleFilter, statusFilter],
    queryFn: () =>
      fetchUsers({
        page,
        limit: 20,
        search: searchQuery || undefined,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
        accountStatus: statusFilter !== "ALL" ? statusFilter : undefined,
      }),
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, status, reason }: { userId: string; status: AccountStatus; reason?: string }) =>
      updateUserStatus(userId, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-stats"] });
      setShowStatusModal(false);
      setActionReason("");
      setSelectedUser(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) => deleteUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-stats"] });
      setShowDeleteModal(false);
      setActionReason("");
      setSelectedUser(null);
    },
  });

  const users = usersData?.data ?? [];
  const pagination = usersData?.pagination;
  const stats = statsData?.data;

  const handleChangeStatus = (user: User) => {
    setSelectedUser(user);
    setNewStatus(user.accountStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE");
    setShowStatusModal(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmStatusChange = () => {
    if (!selectedUser) return;
    updateStatusMutation.mutate({
      userId: selectedUser.id,
      status: newStatus,
      reason: actionReason || undefined,
    });
  };

  const confirmDelete = () => {
    if (!selectedUser || !actionReason.trim()) return;
    deleteMutation.mutate({
      userId: selectedUser.id,
      reason: actionReason,
    });
  };

  if (loadingStats || loadingUsers) {
    return <TableSkeleton statsCount={5} columns={6} />;
  }

  if (error) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <PageHeader title={t("title")} description={t("subtitle")} />
        <ErrorState
          title={t("failedToLoad")}
          message={error instanceof Error ? error.message : t("unknownError")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button variant="outline" size="sm" asChild className="h-8 text-xs font-medium">
            <Link href="/admin/dashboard/clients">
              <Users className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              Client Booking CRM &rarr;
            </Link>
          </Button>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <StatCard
            label={t("totalUsers")}
            value={stats.totalUsers}
            icon={Users}
          />
          <StatCard
            label={t("citizens")}
            value={stats.byRole.citizens}
            icon={UserCheck}
          />
          <StatCard
            label={t("experts")}
            value={stats.byRole.experts}
            icon={Briefcase}
          />
          <StatCard
            label={t("admins")}
            value={stats.byRole.admins}
            icon={Shield}
          />
          <StatCard
            label={t("active")}
            value={stats.byStatus.active}
            icon={UserCheck}
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-3.5 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <Search size={18} className="shrink-0 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("search")}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Filter size={16} className="shrink-0 text-muted-foreground" />
              <Select
                value={roleFilter}
                onValueChange={(value) => {
                  setRoleFilter(value as typeof roleFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full min-[360px]:w-[140px] flex-1 min-w-[120px]">
                  <SelectValue placeholder={t("allRoles")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("allRoles")}</SelectItem>
                  <SelectItem value="CITIZEN">{t("citizens")}</SelectItem>
                  <SelectItem value="EXPERT">{t("experts")}</SelectItem>
                  <SelectItem value="ADMIN">{t("admins")}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as typeof statusFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full min-[360px]:w-[140px] flex-1 min-w-[120px]">
                  <SelectValue placeholder={t("allStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("allStatus")}</SelectItem>
                  <SelectItem value="ACTIVE">{t("active")}</SelectItem>
                  <SelectItem value="INACTIVE">{t("inactive")}</SelectItem>
                  <SelectItem value="SUSPENDED">{t("suspended")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        {/* Desktop & Tablet Table (>= md: 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4">{t("user")}</th>
                <th className="px-6 py-4">{t("role")}</th>
                <th className="px-6 py-4">{t("status")}</th>
                <th className="px-6 py-4">{t("joined")}</th>
                <th className="px-6 py-4">{t("lastLogin")}</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <EmptyState
                      icon={Users}
                      title={t("noUsers")}
                    />
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          src={user.avatarUrl}
                          name={user.fullName}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-foreground">{user.fullName}</p>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail size={10} />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                              <Phone size={10} />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge tone={getRoleTone(user.role)}>
                        {getRoleLabel(user.role)}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge tone={getStatusTone(user.accountStatus)}>
                        {getStatusLabel(user.accountStatus)}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-muted-foreground">{formatDate(user.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-muted-foreground">{formatDate(user.lastLoginAt)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {currentAdmin?.id === user.id ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                            title={t("currentAdminTooltip")}
                          >
                            <Shield className="h-3 w-3" />
                            {t("currentUserBadge")}
                          </span>
                        ) : user.accountStatus !== "DELETED" ? (
                          <>
                            <Button
                              size="xs"
                              variant={user.accountStatus === "ACTIVE" ? "outline" : "default"}
                              onClick={() => handleChangeStatus(user)}
                              disabled={updateStatusMutation.isPending}
                            >
                              {user.accountStatus === "ACTIVE" ? t("deactivate") : t("activate")}
                            </Button>
                            <Button
                              size="xs"
                              variant="destructive"
                              onClick={() => handleDelete(user)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 size={14} />
                              {t("delete")}
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Stack (< md: 768px) */}
        <div className="block md:hidden divide-y divide-border">
          {users.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <EmptyState icon={Users} title={t("noUsers")} />
            </div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar
                      src={user.avatarUrl}
                      name={user.fullName}
                      size="sm"
                      className="h-10 w-10 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      {user.phone && (
                        <p className="text-[11px] text-muted-foreground truncate">{user.phone}</p>
                      )}
                    </div>
                  </div>
                  <StatusBadge tone={getRoleTone(user.role)}>
                    {getRoleLabel(user.role)}
                  </StatusBadge>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                  <StatusBadge tone={getStatusTone(user.accountStatus)}>
                    {getStatusLabel(user.accountStatus)}
                  </StatusBadge>
                  <span>{t("joined")}: {formatDate(user.createdAt)}</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {currentAdmin?.id === user.id ? (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                      title={t("currentAdminTooltip")}
                    >
                      <Shield className="h-3 w-3" />
                      {t("currentUserBadge")}
                    </span>
                  ) : user.accountStatus !== "DELETED" ? (
                    <>
                      <Button
                        size="sm"
                        variant={user.accountStatus === "ACTIVE" ? "outline" : "default"}
                        className="flex-1 h-9 text-xs"
                        onClick={() => handleChangeStatus(user)}
                        disabled={updateStatusMutation.isPending}
                      >
                        {user.accountStatus === "ACTIVE" ? t("deactivate") : t("activate")}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 h-9 text-xs gap-1.5"
                        onClick={() => handleDelete(user)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={13} />
                        {t("delete")}
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 sm:px-6 py-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              {pagination.page} / {pagination.totalPages} ({pagination.total} {t("totalUsers").toLowerCase()})
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="h-8 px-3"
              >
                &#8592;
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
                className="h-8 px-3"
              >
                &#8594;
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Status Change Modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("changeStatus")}</DialogTitle>
            <DialogDescription>
              {t("changeStatusConfirm", { name: selectedUser?.fullName ?? "", status: newStatus })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t("reasonOptional")}
            </label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
              rows={3}
              placeholder={t("reasonPlaceholder")}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowStatusModal(false);
                setActionReason("");
                setSelectedUser(null);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={confirmStatusChange}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? t("changing") : t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteAccount")}</DialogTitle>
            <DialogDescription>
              {t("deleteConfirm", { name: selectedUser?.fullName ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t("reasonForDeletion")}
            </label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
              rows={4}
              placeholder={t("reasonPlaceholderDelete")}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t("minCharsRequired")}</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setActionReason("");
                setSelectedUser(null);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={actionReason.trim().length < 10 || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t("deleting") : t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
