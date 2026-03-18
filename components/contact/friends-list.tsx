"use client";

import { MessageCircle, Loader, UserMinus, MoreHorizontal } from "lucide-react";
import { PresignedAvatar } from "@/components/ui/presigned-avatar";
import { Button } from "@/components/ui/button";
import { User } from "@/types/user";
import { useRouter } from "next/navigation";
import { useRemoveFriend } from "@/hooks/use-contact";
import { useGetPrivateConversation } from "@/hooks/use-chat";
import { formatPresenceStatus } from "@/lib/utils";
import { useState } from "react";

interface FriendsListProps {
  friends: User[];
  isLoading: boolean;
  searchQuery?: string;
}

export function FriendsList({
  friends,
  isLoading,
  searchQuery = "",
}: FriendsListProps) {
  const router = useRouter();
  const { mutate: removeFriend } = useRemoveFriend();
  const { mutate: getPrivateConversation } = useGetPrivateConversation();
  const [expandedFriendId, setExpandedFriendId] = useState<string | null>(null);

  const filteredFriends = friends.filter((friend) =>
    friend.displayName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleMessageFriend = (friendId: string) => {
    // Lấy conversation private đã tồn tại
    getPrivateConversation(friendId, {
      onSuccess: (conversation) => {
        router.push(`/messages/${conversation.id}`);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (filteredFriends.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white py-8 text-center text-slate-500">
        Không tìm thấy bạn bè nào
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {filteredFriends.map((friend) => (
        <div key={friend.id} className="px-1 py-1.5 rounded-xl hover:bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <PresignedAvatar
                avatarKey={friend.avatar}
                displayName={friend.displayName}
                className="w-12 h-12"
                fallbackClassName="bg-slate-100 text-slate-600 text-xs font-semibold"
              />
              {friend.isOnline && (
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold leading-tight text-slate-900">
                {friend.displayName}
              </p>
              <p className="truncate text-[13px] text-slate-500">
                {typeof friend.mutualFriendsCount === "number"
                  ? `${friend.mutualFriendsCount} bạn chung`
                  : formatPresenceStatus(
                      friend.isOnline,
                      friend.lastSeen,
                      friend.lastSeenText,
                    )}
              </p>
            </div>

            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 rounded-full p-0 text-slate-600 hover:bg-slate-100"
              onClick={() =>
                setExpandedFriendId((prev) => (prev === friend.id ? null : friend.id))
              }
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {expandedFriendId === friend.id && (
            <div className="ml-[60px] mt-2 flex gap-2 pb-1">
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg text-xs font-medium text-blue-600"
                onClick={() => handleMessageFriend(friend.id)}
              >
                <MessageCircle className="mr-1 h-4 w-4" />
                Nhắn tin
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg text-xs font-medium text-red-600 hover:text-red-700"
                onClick={() => removeFriend(friend.id)}
              >
                <UserMinus className="mr-1 h-4 w-4" />
                Xóa bạn
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
