"use client";

import { PresignedAvatar } from "@/components/ui/presigned-avatar";
import { Button } from "@/components/ui/button";
import { FriendRequest } from "@/types/friend-request";
import {
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useGetUserEmailById,
} from "@/hooks/use-contact";
import { useState } from "react";
import { Loader } from "lucide-react";

interface FriendRequestsListProps {
  requests: FriendRequest[];
  isLoading?: boolean;
}

function FriendRequestItem({
  request,
  processingIds,
  onAccept,
  onReject,
}: {
  request: FriendRequest;
  processingIds: string[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const requestId = request._id || request.id;

  // Get sender ID from senderId field (which is populated as an object)
  const senderObj =
    typeof request.senderId === "string"
      ? {
          _id: request.senderId,
          displayName: request.sender?.displayName,
          avatar: request.sender?.avatar,
        }
      : request.senderId;
  const senderId = senderObj?._id;

  // Only fetch email, sender info is already populated
  const { data: emailData } = useGetUserEmailById(senderId || "");

  if (!requestId) return null;

  const displayName = senderObj?.displayName || "Unknown";
  const avatar = senderObj?.avatar;
  const email = emailData?.email;

  const isProcessing = processingIds.includes(requestId);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-center gap-3">
        <PresignedAvatar
          avatarKey={avatar}
          displayName={displayName}
          className="h-11 w-11"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">
            {displayName}
          </p>
          {email && <p className="truncate text-xs text-slate-500">{email}</p>}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          size="sm"
          onClick={() => onAccept(requestId)}
          disabled={isProcessing}
          className="h-9 rounded-lg text-xs sm:text-sm"
        >
          {isProcessing ? (
            <Loader className="w-3 h-3 animate-spin" />
          ) : (
            "Chấp nhận"
          )}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onReject(requestId)}
          disabled={isProcessing}
          className="h-9 rounded-lg text-xs sm:text-sm"
        >
          Từ chối
        </Button>
      </div>
    </div>
  );
}

export function FriendRequestsList({
  requests,
  isLoading,
}: FriendRequestsListProps) {
  const { mutate: acceptRequest } = useAcceptFriendRequest();
  const { mutate: rejectRequest } = useRejectFriendRequest();
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  const handleAccept = (id: string) => {
    setProcessingIds((prev) => [...prev, id]);
    acceptRequest(id, {
      onSettled: () => setProcessingIds((prev) => prev.filter((x) => x !== id)),
    });
  };

  const handleReject = (id: string) => {
    setProcessingIds((prev) => [...prev, id]);
    rejectRequest(id, {
      onSettled: () => setProcessingIds((prev) => prev.filter((x) => x !== id)),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-slate-500">
        Không có lời mời kết bạn nào
      </div>
    );
  }

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {requests.map((req) => (
        <FriendRequestItem
          key={req._id || req.id}
          request={req}
          processingIds={processingIds}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      ))}
    </div>
  );
}
