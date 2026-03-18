"use client";

import { useState } from "react";
import { Search, UserPlus, Loader, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PresignedAvatar } from "@/components/ui/presigned-avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useSearchUsers,
  useSendFriendRequest,
  useGetUserEmailById,
} from "@/hooks/use-contact";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User } from "@/types/user";

interface SearchAndAddFriendProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SearchResultItem({
  user,
  onSendRequest,
  isSending,
}: {
  user: User;
  onSendRequest: (userId: string) => void;
  isSending: boolean;
}) {
  const { data: emailData } = useGetUserEmailById(user.id);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-slate-300 sm:p-4">
      <div className="flex items-center gap-3">
        <PresignedAvatar
          avatarKey={user.avatar}
          displayName={user.displayName}
          className="h-11 w-11 ring-1 ring-blue-100"
          fallbackClassName="text-base"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">
            {user.displayName}
          </p>
          {emailData?.email && (
            <p className="truncate text-xs text-slate-500 sm:text-sm">
              {emailData.email}
            </p>
          )}
        </div>
      </div>
      <Button
        size="sm"
        onClick={() => onSendRequest(user.id)}
        disabled={isSending}
        className="mt-3 h-9 w-full gap-2 rounded-lg bg-blue-600 text-white shadow-sm transition-all hover:bg-blue-700 sm:mt-0 sm:w-auto"
      >
        {isSending ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            Thêm bạn
          </>
        )}
      </Button>
    </div>
  );
}

export function SearchAndAddFriend({
  open,
  onOpenChange,
}: SearchAndAddFriendProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchData, isLoading } = useSearchUsers(searchQuery);
  const { mutate: sendFriendRequest, isPending } = useSendFriendRequest();

  const searchResults = searchData?.users || [];

  const handleSendRequest = (userId: string) => {
    if (!userId) {
      return;
    }
    sendFriendRequest(userId, {
      onSuccess: () => {
        // Optionally close dialog or show success message
      },
    });
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] max-h-[88dvh] max-w-2xl gap-0 overflow-hidden rounded-2xl bg-white p-0">
        <DialogHeader className="border-b border-slate-200 px-4 py-3 sm:px-5">
          <DialogTitle className="text-base font-semibold text-slate-900">
            Tìm kiếm và thêm bạn
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-col space-y-4 overflow-hidden px-4 pb-4 pt-4 sm:px-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
              className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 pr-10 text-slate-900 placeholder:text-slate-500 focus-visible:ring-blue-500"
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value;
                setSearchQuery(value);
              }}
            />
            {searchQuery && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 transition-colors hover:bg-red-100 hover:text-red-600"
                onClick={handleClearSearch}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          <ScrollArea className="flex-1 pr-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-7 w-7 animate-spin text-blue-500" />
              </div>
            ) : searchQuery.length === 0 ? (
              <div className="py-16 text-center text-slate-600">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                  <Search className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-sm font-medium sm:text-base">
                  Nhập tên, email hoặc số điện thoại để tìm kiếm
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-16 text-center text-slate-600">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-sm font-medium sm:text-base">
                  Không tìm thấy người dùng nào
                </p>
              </div>
            ) : (
              <div className="space-y-2 pb-1">
                {searchResults.map((user: User) => (
                  <SearchResultItem
                    key={user.id}
                    user={user}
                    onSendRequest={handleSendRequest}
                    isSending={isPending}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
