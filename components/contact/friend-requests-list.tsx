"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FriendRequest } from "@/types/friend-request";
import { useAcceptFriendRequest, useRejectFriendRequest } from "@/hooks/use-contact";
import { useState } from "react";
import { Loader } from "lucide-react";

interface FriendRequestsListProps {
  requests: FriendRequest[];
  isLoading?: boolean;
}

export function FriendRequestsList({ requests, isLoading }: FriendRequestsListProps) {
  const { mutate: acceptRequest } = useAcceptFriendRequest();
  const { mutate: rejectRequest } = useRejectFriendRequest();
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  const handleAccept = (requestId: string) => {
    setProcessingIds([...processingIds, requestId]);
    acceptRequest(requestId, {
      onSettled: () => {
        setProcessingIds(processingIds.filter(id => id !== requestId));
      },
    });
  };

  const handleReject = (requestId: string) => {
    setProcessingIds([...processingIds, requestId]);
    rejectRequest(requestId, {
      onSettled: () => {
        setProcessingIds(processingIds.filter(id => id !== requestId));
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        Không có lời mời kết bạn nào
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div
          key={request.id}
          className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all"
        >
          <Avatar className="h-12 w-12">
            {request.sender?.avatar ? (
              <img
                src={request.sender.avatar}
                alt={request.sender.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <AvatarFallback className="bg-slate-100 font-bold">
                {request.sender?.displayName?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex-1">
            <p className="font-semibold text-sm text-slate-900">
              {request.sender?.displayName || 'Unknown'}
            </p>
            <p className="text-xs text-slate-400">
              {request.sender?.bio || 'Người dùng'}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 h-8 px-4 rounded-lg"
              onClick={() => handleAccept(request.id)}
              disabled={processingIds.includes(request.id)}
            >
              {processingIds.includes(request.id) ? (
                <Loader className="w-3 h-3 animate-spin" />
              ) : (
                'Chấp nhận'
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-4 rounded-lg"
              onClick={() => handleReject(request.id)}
              disabled={processingIds.includes(request.id)}
            >
              Từ chối
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
