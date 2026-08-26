"use client";

import { useState } from "react";
import {
  Users,
  UserCheck,
  Briefcase,
  Shield,
  Search,
  Filter,
  Eye,
  Trash2,
  Mail,
  Phone,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
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

const getRoleLabel = (role: UserRole) => {
  const labels: Record<UserRole, string> = {
    CITIZEN: "Citizen",
    EXPERT: "Expert",
    ADMIN: "Admin",
  };
  return labels[role];
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

const getStatusLabel = (status: AccountStatus) => {
  const labels: Record<AccountStatus, string> = {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    SUSPENDED: "Suspended",
    DELETED: "Deleted",
  };
  return labels[status];
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "Never";
  try {
    return format(new Date(dateString), "MMM dd, yyyy");
  } catch {
    return dateString;
  }
};

export default function UsersPage() {
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
    setNewStatus(user.accountStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE");
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
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <LoadingSpinner label="Loading users..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <PageHeader title="User Management" description="Manage all platform users and accounts" />
        <ErrorState
          title="Failed to load users"
          message={error instanceof Error ? error.message : "Unknown error occurred"}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="User Management"
        description="Manage all platform users and accounts"
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard
            label="Total Users"
            value={stats.totalUsers}
            icon={Users}
          />
          <StatCard
            label="Citizens"
            value={stats.byRole.citizens}
            icon={UserCheck}
          />
          <StatCard
            label="Experts"
            value={stats.byRole.experts}
            icon={Briefcase}
          />
          <StatCard
            label="Admins"
            value={stats.byRole.admins}
            icon={Shield}
          />
          <StatCard
            label="Active"
            value={stats.byStatus.active}
            icon={UserCheck}
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <Search size={18} className="shrink-0 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name or email..."
                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="flex items-center gap-3">
              <Filter size={16} className="shrink-0 text-muted-foreground" />
              <Select
                value={roleFilter}
                onValueChange={(value) => {
                  setRoleFilter(value as typeof roleFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="CITIZEN">Citizens</SelectItem>
                  <SelectItem value="EXPERT">Experts</SelectItem>
                  <SelectItem value="ADMIN">Admins</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as typeof statusFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <EmptyState
                      icon={Users}
                      title="No users found"
                      description="No users match your current filters."
                    />
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.accountStatus !== "DELETED" && (
                          <>
                            <Button
                              size="xs"
                              variant="default"
                              onClick={() => handleChangeStatus(user)}
                              disabled={updateStatusMutation.isPending}
                            >
                              {user.accountStatus === "ACTIVE" ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              size="xs"
                              variant="destructive"
                              onClick={() => handleDelete(user)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 size={14} />
                              Delete
                            </Button>
                          </>
                        )}
                        <Button size="icon-xs" variant="outline">
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

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex items-center gap-2">
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
                disabled={page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Status Change Modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Status</DialogTitle>
            <DialogDescription>
              Change status for <span className="font-medium text-foreground">{selectedUser?.fullName}</span> to{" "}
              <span className="font-medium text-foreground">{newStatus}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Reason (optional)
            </label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
              rows={3}
              placeholder="Provide a reason for status change..."
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
              Cancel
            </Button>
            <Button
              onClick={confirmStatusChange}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Changing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User Account</DialogTitle>
            <DialogDescription>
              You are about to delete <span className="font-medium text-foreground">{selectedUser?.fullName}</span>. This action cannot be easily reversed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Reason for deletion *
            </label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
              rows={4}
              placeholder="Provide a detailed reason for deletion..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Minimum 10 characters required</p>
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
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={actionReason.trim().length < 10 || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
