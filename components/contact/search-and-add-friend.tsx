"use client"

import { useState } from "react";
import { Search, UserPlus, Loader, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearchUsers, useSendFriendRequest, useGetUserEmailById } from "@/hooks/use-contact";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User } from "@/types/user";

interface SearchAndAddFriendProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SearchResultItem({ user, onSendRequest, isSending }: { user: User; onSendRequest: (userId: string) => void; isSending: boolean }) {
  const { data: emailData } = useGetUserEmailById(user.id);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-slate-100">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          {user.avatar ? (
            <img src={user.avatar} alt={user.displayName} className="w-full h-full object-cover" />
          ) : (
            <AvatarFallback className="bg-slate-100 font-bold">
              {user.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <p className="font-semibold text-sm">{user.displayName}</p>
          {emailData?.email && (
            <p className="text-xs text-slate-400">{emailData.email}</p>
          )}
        </div>
      </div>
      <Button
        size="sm"
        onClick={() => onSendRequest(user.id)}
        disabled={isSending}
        className="flex items-center gap-2"
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

export function SearchAndAddFriend({ open, onOpenChange }: SearchAndAddFriendProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchData, isLoading, error } = useSearchUsers(searchQuery);
  const { mutate: sendFriendRequest, isPending } = useSendFriendRequest();
  
  
  const searchResults = searchData?.users || [];

  const handleSendRequest = (userId: string) => {
    if (!userId) {
      return;
    }
    sendFriendRequest(userId, {
      onSuccess: () => {
        // Optionally close dialog or show success message
      }
    });
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Tìm kiếm và thêm bạn</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
              className="pl-9 pr-9"
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
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={handleClearSearch}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Search Results */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : searchQuery.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Nhập tên, email hoặc số điện thoại để tìm kiếm</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Không tìm thấy người dùng nào</p>
              </div>
            ) : (
              <div className="space-y-2 pr-2">
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
