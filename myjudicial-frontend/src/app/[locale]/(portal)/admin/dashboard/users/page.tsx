"use client";

import { useState } from "react";
import {
  Users,
  UserCheck,
  Briefcase,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Ban,
  Trash2,
  Mail,
  Phone,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { format } from "date-fns";

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
const getRoleBadge = (role: UserRole) => {
  const configs = {
    CITIZEN: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Users, label: "Citizen" },
    EXPERT: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: Briefcase, label: "Expert" },
    ADMIN: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: Shield, label: "Admin" },
  };

  const config = configs[role];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};

const getStatusBadge = (status: AccountStatus) => {
  const configs = {
    ACTIVE: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle, label: "Active" },
    INACTIVE: { color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400", icon: XCircle, label: "Inactive" },
    SUSPENDED: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: Ban, label: "Suspended" },
    DELETED: { color: "bg-black/10 text-black dark:bg-white/10 dark:text-white", icon: Trash2, label: "Deleted" },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
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
      <div className="flex items-center justify-center p-6 lg:p-8" style={{ minHeight: "60vh" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-6 lg:p-8" style={{ minHeight: "60vh" }}>
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Failed to load users</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage all platform users and accounts</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
              <Users size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalUsers}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Total Users</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
              <UserCheck size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.byRole.citizens}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Citizens</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-600/10 text-green-600">
              <Briefcase size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.byRole.experts}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Experts</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/10 text-purple-600">
              <Shield size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.byRole.admins}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Admins</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-600/10 text-green-600">
              <CheckCircle size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.byStatus.active}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Active</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-4 shadow-md lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="flex-1 border-0 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 dark:text-gray-100"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          <Filter size={16} className="text-gray-400" />
          <select
            className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:bg-gray-800 dark:text-gray-100"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as typeof roleFilter);
              setPage(1);
            }}
          >
            <option value="ALL">All Roles</option>
            <option value="CITIZEN">Citizens</option>
            <option value="EXPERT">Experts</option>
            <option value="ADMIN">Admins</option>
          </select>

          <select
            className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:bg-gray-800 dark:text-gray-100"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setPage(1);
            }}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-border/10 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/10">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No users found.</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-brand-canvas dark:hover:bg-gray-800">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{user.fullName}</p>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Mail size={10} />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <Phone size={10} />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4">{getStatusBadge(user.accountStatus)}</td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700 dark:text-gray-300">{formatDate(user.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700 dark:text-gray-300">{formatDate(user.lastLoginAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.accountStatus !== "DELETED" && (
                          <>
                            <button
                              onClick={() => handleChangeStatus(user)}
                              disabled={updateStatusMutation.isPending}
                              className="inline-flex items-center gap-1 rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-blue/90 disabled:opacity-50"
                            >
                              {user.accountStatus === "ACTIVE" ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              disabled={deleteMutation.isPending}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </>
                        )}
                        <button className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                          <Eye size={14} />
                        </button>
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
          <div className="flex items-center justify-between border-t border-brand-border/10 px-6 py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
                className="rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Change Modal */}
      {showStatusModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Change User Status</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Change status for <span className="font-medium">{selectedUser.fullName}</span> to{" "}
              <span className="font-medium">{newStatus}</span>?
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reason (optional)
              </label>
              <textarea
                className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-gray-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:bg-gray-800 dark:text-gray-100"
                rows={3}
                placeholder="Provide a reason for status change..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setActionReason("");
                  setSelectedUser(null);
                }}
                className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={updateStatusMutation.isPending}
                className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-blue/90 disabled:opacity-50"
              >
                {updateStatusMutation.isPending ? "Changing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Delete User Account</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              You are about to delete <span className="font-medium">{selectedUser.fullName}</span>. This action cannot be easily reversed.
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reason for deletion *
              </label>
              <textarea
                className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-gray-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:bg-gray-800 dark:text-gray-100"
                rows={4}
                placeholder="Provide a detailed reason for deletion..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">Minimum 10 characters required</p>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setActionReason("");
                  setSelectedUser(null);
                }}
                className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={actionReason.trim().length < 10 || deleteMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
