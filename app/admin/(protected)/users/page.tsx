"use client";

import { FormEvent, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminService,
  AdminUser,
  AdminUserRoleFilter,
  AdminUserStatusFilter,
  AdminUserSortBy,
} from "@/api/admin";
import { toast } from "sonner";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
  User,
  Users,
  UserCheck,
  UserX,
  ArrowUpDown,
  FilterX,
  SlidersHorizontal,
  Lock,
  LockOpen,
  Clock3,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal } from "lucide-react";
import { AccountStatus } from "@/types/user";
import { UpdateAccountStatusPayload } from "@/api/user";

const LIMIT_OPTIONS = [20];

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState<AdminUserRoleFilter>("all");
  const [statusFilter, setStatusFilter] =
    useState<AdminUserStatusFilter>("all");
  const [sortBy, setSortBy] = useState<AdminUserSortBy>("newest");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftRoleFilter, setDraftRoleFilter] =
    useState<AdminUserRoleFilter>("all");
  const [draftStatusFilter, setDraftStatusFilter] =
    useState<AdminUserStatusFilter>("all");
  const [draftSortBy, setDraftSortBy] = useState<AdminUserSortBy>("newest");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [draftDateFrom, setDraftDateFrom] = useState("");
  const [draftDateTo, setDraftDateTo] = useState("");
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [nextAccountStatus, setNextAccountStatus] =
    useState<AccountStatus>("active");
  const [isStatusFixed, setIsStatusFixed] = useState(false);
  const [statusReasonInput, setStatusReasonInput] = useState("");
  const [suspendedUntilInput, setSuspendedUntilInput] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin",
      "users",
      offset,
      limit,
      search,
      roleFilter,
      statusFilter,
      sortBy,
      dateFrom,
      dateTo,
    ],
    queryFn: () =>
      adminService.getUsers({
        offset,
        limit,
        search,
        role: roleFilter,
        status: statusFilter,
        sortBy,
        dateFrom,
        dateTo,
      }),
  });

  const { mutate: updateAccountStatus, isPending: isUpdatingAccountStatus } =
    useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: UpdateAccountStatusPayload;
      }) => adminService.updateUserAccountStatus(id, payload),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["admin", "users"] });
        toast.success("Đã cập nhật trạng thái tài khoản");
        setIsStatusDialogOpen(false);
        setSelectedUser(null);
        setIsStatusFixed(false);
        setStatusReasonInput("");
        setSuspendedUntilInput("");
      },
      onError: () => toast.error("Cập nhật trạng thái thất bại"),
    });

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setOffset(0);
  };

  const users: AdminUser[] = data?.users || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.page || Math.floor(offset / limit) + 1;
  const hasPrev = data?.hasPrev ?? offset > 0;
  const hasNext = data?.hasNext ?? currentPage < totalPages;

  const getUserAccountStatus = (user: AdminUser): AccountStatus => {
    if (user.accountStatus) {
      return user.accountStatus;
    }
    return user.isActive ? "active" : "locked";
  };

  const activeCount = users.filter(
    (u) => getUserAccountStatus(u) === "active",
  ).length;
  const suspendedCount = users.filter(
    (u) => getUserAccountStatus(u) === "suspended",
  ).length;
  const lockedCount = users.filter(
    (u) => getUserAccountStatus(u) === "locked",
  ).length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const stats = {
    total: data?.total ?? 0,
    active: activeCount,
    blocked: suspendedCount + lockedCount,
    admin: adminCount,
  };

  const openAccountStatusDialog = (user: AdminUser, status: AccountStatus) => {
    setSelectedUser(user);
    setNextAccountStatus(status);
    setIsStatusFixed(status === "suspended");
    setStatusReasonInput("");
    setSuspendedUntilInput("");
    setIsStatusDialogOpen(true);
  };

  const handleSubmitAccountStatus = () => {
    if (!selectedUser) return;

    if (nextAccountStatus === "suspended" && !suspendedUntilInput) {
      toast.error("Vui lòng chọn ngày hết hạn đình chỉ");
      return;
    }

    const payload: UpdateAccountStatusPayload = {
      accountStatus: nextAccountStatus,
      statusReason: statusReasonInput.trim() || undefined,
    };

    if (nextAccountStatus === "suspended") {
      payload.suspendedUntil = suspendedUntilInput;
    }

    updateAccountStatus({
      id: selectedUser._id || selectedUser.id,
      payload,
    });
  };

  const getStatusBadge = (user: AdminUser) => {
    const status = getUserAccountStatus(user);

    if (status === "active") {
      return {
        className:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
        label: "Hoạt động",
      };
    }

    if (status === "suspended") {
      return {
        className:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
        label: "Đình chỉ",
      };
    }

    return {
      className:
        "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400",
      label: "Đã khóa",
    };
  };

  const hasFilter =
    roleFilter !== "all" ||
    statusFilter !== "all" ||
    sortBy !== "newest" ||
    dateFrom.length > 0 ||
    dateTo.length > 0 ||
    search.length > 0;

  const activeFilterCount =
    Number(roleFilter !== "all") +
    Number(statusFilter !== "all") +
    Number(sortBy !== "newest") +
    Number(Boolean(dateFrom || dateTo));

  const openFilterDialog = () => {
    setDraftRoleFilter(roleFilter);
    setDraftStatusFilter(statusFilter);
    setDraftSortBy(sortBy);
    setDraftDateFrom(dateFrom);
    setDraftDateTo(dateTo);
    setIsFilterOpen(true);
  };

  const applyFilters = () => {
    if (
      draftDateFrom &&
      draftDateTo &&
      new Date(draftDateFrom) > new Date(draftDateTo)
    ) {
      toast.error("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc");
      return;
    }

    setRoleFilter(draftRoleFilter);
    setStatusFilter(draftStatusFilter);
    setSortBy(draftSortBy);
    setDateFrom(draftDateFrom);
    setDateTo(draftDateTo);
    setOffset(0);
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    setRoleFilter("all");
    setStatusFilter("all");
    setSortBy("newest");
    setDraftRoleFilter("all");
    setDraftStatusFilter("all");
    setDraftSortBy("newest");
    setDateFrom("");
    setDateTo("");
    setDraftDateFrom("");
    setDraftDateTo("");
    setSearch("");
    setSearchInput("");
    setOffset(0);
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-2 h-dvh md:p-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="px-3 py-2.5 bg-white border shadow-sm min-h-24 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Tổng người dùng
            </p>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {stats.total}
          </p>
        </div>
        <div className="px-3 py-2.5 bg-white border shadow-sm min-h-24 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Đang hoạt động
            </p>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.active}
          </p>
        </div>
        <div className="px-3 py-2.5 bg-white border shadow-sm min-h-24 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Đã khóa
            </p>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <p className="mt-1 text-xl font-bold text-rose-600 dark:text-rose-400">
            {stats.blocked}
          </p>
        </div>
        <div className="px-3 py-2.5 bg-white border shadow-sm min-h-24 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Quản trị viên
            </p>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="mt-1 text-xl font-bold text-blue-600 dark:text-blue-400">
            {stats.admin}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-800">
        <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
          <form
            onSubmit={handleSearch}
            className="flex flex-col w-full gap-2 md:flex-row md:items-center"
          >
            <div className="relative w-full md:max-w-md md:flex-1">
              <Search className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo tên, email..."
                className="w-full pl-9 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="text-white bg-blue-600 hover:bg-blue-700"
            >
              Tìm kiếm
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={openFilterDialog}
              className="gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Bộ lọc
              {activeFilterCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              disabled={!hasFilter}
              className="gap-2"
            >
              <FilterX className="w-4 h-4" />
              Xóa bộ lọc
            </Button>
          </form>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center flex-1 py-14">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 py-14 text-slate-400">
            <Users className="w-8 h-8" />
            <p>Không tìm thấy người dùng phù hợp</p>
            {hasFilter && (
              <Button size="sm" variant="outline" onClick={clearFilters}>
                Xóa bộ lọc để xem tất cả
              </Button>
            )}
          </div>
        ) : (
          <div className="flex-1 min-h-[45dvh] overflow-auto md:min-h-[52dvh]">
            <table className="w-full min-w-[720px] text-sm border-separate border-spacing-0">
              <thead className="[&_tr]:border-b">
                <tr className="bg-slate-50 dark:bg-slate-800/60">
                  <th className="sticky top-0 z-20 px-5 py-2.5 font-semibold text-left align-middle text-slate-500 bg-slate-50 dark:bg-slate-800/95 dark:text-slate-400">
                    Người dùng
                  </th>
                  <th className="sticky top-0 z-20 hidden px-5 py-2.5 font-semibold text-left align-middle text-slate-500 bg-slate-50 dark:bg-slate-800/95 dark:text-slate-400 md:table-cell">
                    Email
                  </th>
                  <th className="sticky top-0 z-20 px-5 py-2.5 font-semibold text-left align-middle text-slate-500 bg-slate-50 dark:bg-slate-800/95 dark:text-slate-400">
                    Role
                  </th>
                  <th className="sticky top-0 z-20 px-5 py-2.5 font-semibold text-left align-middle text-slate-500 bg-slate-50 dark:bg-slate-800/95 dark:text-slate-400">
                    Trạng thái
                  </th>
                  <th className="sticky top-0 z-20 hidden px-5 py-2.5 font-semibold text-left align-middle text-slate-500 bg-slate-50 dark:bg-slate-800/95 dark:text-slate-400 lg:table-cell">
                    Ngày tạo
                  </th>
                  <th className="sticky top-0 z-20 px-5 py-2.5 text-right align-middle bg-slate-50 dark:bg-slate-800/95">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {users.map((u) => {
                  const status = getStatusBadge(u);
                  const currentAccountStatus = getUserAccountStatus(u);

                  return (
                    <tr
                      key={u._id || u.id}
                      className="transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/30"
                    >
                      <td className="px-5 py-2.5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center flex-shrink-0 text-xs font-bold text-white rounded-full h-9 w-9 bg-gradient-to-br from-blue-500 to-purple-500">
                            {u.displayName?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {u.displayName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 align-middle text-slate-500 dark:text-slate-400 hidden md:table-cell">
                        {u.email}
                      </td>
                      <td className="px-5 py-2.5 align-middle">
                        <Badge
                          variant="secondary"
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            u.role === "admin"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                          }`}
                        >
                          {u.role === "admin" ? (
                            <ShieldCheck className="w-3 h-3" />
                          ) : (
                            <User className="w-3 h-3" />
                          )}
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-2.5 align-middle">
                        <Badge
                          variant="secondary"
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-2.5 align-middle text-xs text-slate-400 hidden lg:table-cell">
                        {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-5 py-2.5 text-right align-middle">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                              <MoreHorizontal className="w-4 h-4 text-slate-500" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-white dark:bg-slate-800"
                          >
                            {currentAccountStatus !== "active" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  openAccountStatusDialog(u, "active")
                                }
                                disabled={isUpdatingAccountStatus}
                                className="gap-2 cursor-pointer"
                              >
                                <LockOpen className="w-4 h-4 text-emerald-500" />
                                Mở lại tài khoản
                              </DropdownMenuItem>
                            )}
                            {currentAccountStatus !== "locked" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    openAccountStatusDialog(u, "suspended")
                                  }
                                  disabled={isUpdatingAccountStatus}
                                  className="gap-2 cursor-pointer"
                                >
                                  <Clock3 className="w-4 h-4 text-amber-500" />
                                  Đình chỉ tạm thời
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    openAccountStatusDialog(u, "locked")
                                  }
                                  disabled={isUpdatingAccountStatus}
                                  className="gap-2 cursor-pointer"
                                >
                                  <Lock className="w-4 h-4 text-rose-500" />
                                  Khóa tài khoản
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 px-3 py-2 border-t md:flex-row md:items-center md:justify-between border-slate-200 dark:border-slate-700">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Trang {currentPage} / {totalPages} · {data?.total ?? 0} kết quả
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Hiển thị</span>
              <Select
                value={String(limit)}
                onValueChange={(value) => {
                  setLimit(Number(value));
                  setOffset(0);
                }}
              >
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[70] bg-white opacity-100 dark:bg-slate-800">
                  {LIMIT_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={String(opt)}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-slate-400">/ trang</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
              disabled={!hasPrev}
              className="dark:border-slate-600 dark:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset((prev) => prev + limit)}
              disabled={!hasNext}
              className="dark:border-slate-600 dark:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bộ lọc người dùng</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-slate-700">Vai trò</p>
              <Select
                value={draftRoleFilter}
                onValueChange={(value: AdminUserRoleFilter) =>
                  setDraftRoleFilter(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Lọc theo vai trò" />
                </SelectTrigger>
                <SelectContent className="z-[70] bg-white opacity-100 dark:bg-slate-800">
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium text-slate-700">Trạng thái</p>
              <Select
                value={draftStatusFilter}
                onValueChange={(value: AdminUserStatusFilter) =>
                  setDraftStatusFilter(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent className="z-[70] bg-white opacity-100 dark:bg-slate-800">
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="suspended">Đình chỉ</SelectItem>
                  <SelectItem value="locked">Đã khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium text-slate-700">Sắp xếp</p>
              <Select
                value={draftSortBy}
                onValueChange={(value: AdminUserSortBy) =>
                  setDraftSortBy(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent className="z-[70] bg-white opacity-100 dark:bg-slate-800">
                  <SelectItem value="newest">Mới nhất</SelectItem>
                  <SelectItem value="oldest">Cũ nhất</SelectItem>
                  <SelectItem value="name_asc">Tên A-Z</SelectItem>
                  <SelectItem value="name_desc">Tên Z-A</SelectItem>
                  <SelectItem value="online_first">Online trước</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium text-slate-700">Khoảng ngày</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input
                  type="date"
                  value={draftDateFrom}
                  onChange={(e) => setDraftDateFrom(e.target.value)}
                />
                <Input
                  type="date"
                  value={draftDateTo}
                  onChange={(e) => setDraftDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFilterOpen(false)}
            >
              Hủy
            </Button>
            <Button type="button" onClick={applyFilters}>
              Áp dụng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isStatusDialogOpen}
        onOpenChange={(open) => {
          setIsStatusDialogOpen(open);
          if (!open) {
            setSelectedUser(null);
            setIsStatusFixed(false);
            setStatusReasonInput("");
            setSuspendedUntilInput("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái tài khoản</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Người dùng:{" "}
              <span className="font-semibold">{selectedUser?.displayName}</span>
            </p>

            <div className="space-y-1.5">
              <p className="text-sm font-medium text-slate-700">
                Trạng thái mới
              </p>
              {isStatusFixed ? (
                <div className="px-3 py-2 text-sm border rounded-md border-slate-200 bg-slate-50 text-slate-700">
                  Đình chỉ
                </div>
              ) : (
                <Select
                  value={nextAccountStatus}
                  onValueChange={(value: AccountStatus) =>
                    setNextAccountStatus(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[70] bg-white opacity-100 dark:bg-slate-800">
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="suspended">Đình chỉ</SelectItem>
                    <SelectItem value="locked">Đã khóa</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {nextAccountStatus === "suspended" && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-slate-700">
                  Ngày hết hạn đình chỉ (bắt buộc)
                </p>
                <Input
                  type="date"
                  value={suspendedUntilInput}
                  onChange={(e) => setSuspendedUntilInput(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <p className="text-sm font-medium text-slate-700">Lý do</p>
              <Textarea
                value={statusReasonInput}
                onChange={(e) => setStatusReasonInput(e.target.value)}
                placeholder="Nhập lý do khóa/đình chỉ (không bắt buộc)"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSubmitAccountStatus}
              disabled={isUpdatingAccountStatus}
            >
              {isUpdatingAccountStatus ? "Đang cập nhật..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
