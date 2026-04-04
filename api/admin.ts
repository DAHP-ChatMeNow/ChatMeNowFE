import api from "@/lib/axios";
import { AccountStatus } from "@/types/user";
import { userService, UpdateAccountStatusPayload } from "@/api/user";

// ===================== Users =====================
export interface AdminUser {
  _id: string;
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  accountStatus?: AccountStatus;
  suspendedUntil?: string;
  statusReason?: string;
  isPremium?: boolean;
  createdAt: string;
}

export interface AdminUsersResponse {
  success: boolean;
  users: AdminUser[];
  total: number;
  offset?: number;
  limit?: number;
  page: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export type AdminUserRoleFilter = "all" | "user" | "admin";
export type AdminUserStatusFilter =
  | "all"
  | "active"
  | "suspended"
  | "locked"
  | "inactive"
  | "premium";
export type AdminUserSortBy =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc"
  | "online_first";

export interface AdminUsersQueryParams {
  offset?: number;
  limit?: number;
  search?: string;
  role?: AdminUserRoleFilter;
  status?: AdminUserStatusFilter;
  sortBy?: AdminUserSortBy;
  dateFrom?: string;
  dateTo?: string;
  // Keep for backward compatibility if an old caller still passes page.
  page?: number;
}

const getUsers = async ({
  offset = 0,
  limit = 7,
  search = "",
  role = "all",
  status = "all",
  sortBy = "newest",
  dateFrom = "",
  dateTo = "",
  page,
}: AdminUsersQueryParams = {}) => {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safeOffset = Math.max(offset, 0);
  const fallbackPage = Math.floor(safeOffset / safeLimit) + 1;

  const { data } = await api.get<AdminUsersResponse>("/users/all", {
    params: {
      offset: safeOffset,
      limit: safeLimit,
      search,
      role,
      status,
      sortBy,
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
      page: page ?? fallbackPage,
    },
  });
  return data;
};

const toggleUserActive = async (userId: string, isActive: boolean) => {
  const { data } = await api.patch(`/admin/users/${userId}`, { isActive });
  return data;
};

const updateUserAccountStatus = async (
  userId: string,
  payload: UpdateAccountStatusPayload,
) => {
  return userService.updateAccountStatus(userId, payload);
};

// ===================== Posts =====================
export interface AdminPost {
  _id: string;
  id: string;
  content: string;
  author: { _id: string; displayName: string; email: string; avatar?: string };
  media?: { url: string; type: string }[];
  likesCount: number;
  commentsCount: number;
  privacy: string;
  status?: string; // "pending" | "approved" | "rejected"
  createdAt: string;
}

export interface AdminPostsResponse {
  posts: AdminPost[];
  total: number;
  page: number;
  totalPages: number;
}

const getPosts = async (page = 1, limit = 20, status = "") => {
  const { data } = await api.get<AdminPostsResponse>("/admin/posts", {
    params: { page, limit, ...(status ? { status } : {}) },
  });
  return data;
};

const approvePost = async (postId: string) => {
  const { data } = await api.patch(`/admin/posts/${postId}/approve`);
  return data;
};

const rejectPost = async (postId: string, reason?: string) => {
  const { data } = await api.patch(`/admin/posts/${postId}/reject`, { reason });
  return data;
};

const deletePost = async (postId: string) => {
  const { data } = await api.delete(`/admin/posts/${postId}`);
  return data;
};

// ===================== Stats =====================
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  pendingPosts: number;
  newUsersToday: number;
  newPostsToday: number;
}

const getStats = async () => {
  const { data } = await api.get<{ stats: AdminStats }>("/admin/stats");
  return data.stats;
};

export const adminService = {
  getUsers,
  toggleUserActive,
  updateUserAccountStatus,
  getPosts,
  approvePost,
  rejectPost,
  deletePost,
  getStats,
};
