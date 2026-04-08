"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PresignedAvatar } from "@/components/ui/presigned-avatar";
import { useGetFriendProfile } from "@/hooks/use-contact";
import { useGetPrivateConversation } from "@/hooks/use-chat";
import { formatPresenceStatus } from "@/lib/utils";

interface FriendProfileViewProps {
  userId: string;
}

export default function FriendProfileView({ userId }: FriendProfileViewProps) {
  const router = useRouter();

  const { data: friend, isLoading, error } = useGetFriendProfile(userId);
  const { mutate: getPrivateConversation, isPending: isOpeningChat } =
    useGetPrivateConversation();

  const statusText = useMemo(
    () =>
      formatPresenceStatus(
        friend?.isOnline,
        friend?.lastSeen,
        friend?.lastSeenText,
      ),
    [friend?.isOnline, friend?.lastSeen, friend?.lastSeenText],
  );

  const handleOpenChat = () => {
    if (!friend?.id) return;

    getPrivateConversation(friend.id, {
      onSuccess: (conversation) => {
        router.push(`/messages?conversationId=${conversation.id}`);
      },
    });
  };

  return (
    <div className="flex w-full h-full bg-slate-50/50">
      <ScrollArea className="flex-1">
        <div className="max-w-3xl px-4 py-5 mx-auto space-y-4 md:px-6 md:py-7">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => router.back()}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold md:text-xl text-slate-900">
              Trang cá nhân
            </h1>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <Loader2 className="w-6 h-6 mr-2 animate-spin" />
              Đang tải thông tin...
            </div>
          ) : error || !friend ? (
            <div className="p-6 text-center bg-white border rounded-2xl border-slate-200 text-slate-500">
              Không thể tải thông tin trang cá nhân.
            </div>
          ) : (
            <>
              <div className="overflow-hidden bg-white border rounded-2xl border-slate-200">
                <div className="h-36 md:h-48 bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-500" />
                <div className="px-5 pb-5 md:px-7 md:pb-7">
                  <div className="flex items-end justify-between gap-4 -mt-12 md:-mt-14">
                    <PresignedAvatar
                      avatarKey={friend.avatar}
                      displayName={friend.displayName}
                      className="w-24 h-24 border-4 border-white shadow-lg md:h-28 md:w-28"
                      fallbackClassName="text-3xl font-bold"
                    />

                    <Button
                      onClick={handleOpenChat}
                      disabled={isOpeningChat}
                      className="rounded-xl"
                    >
                      {isOpeningChat ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <MessageCircle className="w-4 h-4 mr-2" />
                      )}
                      Nhắn tin
                    </Button>
                  </div>

                  <div className="mt-3">
                    <h2 className="text-2xl font-bold text-slate-900">
                      {friend.displayName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">{statusText}</p>
                    {friend.bio && (
                      <p className="mt-3 text-sm text-slate-600">
                        {friend.bio}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-5">
                    <div className="p-3 text-center rounded-xl bg-slate-50">
                      <div className="text-lg font-semibold text-slate-900">
                        {friend.friendsCount ?? 0}
                      </div>
                      <div className="text-xs text-slate-500">Bạn bè</div>
                    </div>
                    <div className="p-3 text-center rounded-xl bg-slate-50">
                      <div className="text-lg font-semibold text-slate-900">
                        {friend.mutualFriendsCount ?? 0}
                      </div>
                      <div className="text-xs text-slate-500">Bạn chung</div>
                    </div>
                    <div className="p-3 text-center rounded-xl bg-slate-50">
                      <div className="text-lg font-semibold text-slate-900">
                        {friend.isFriend ? "Có" : "Không"}
                      </div>
                      <div className="text-xs text-slate-500">Bạn bè</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
