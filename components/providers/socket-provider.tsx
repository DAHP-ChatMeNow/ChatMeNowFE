"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/use-auth-store";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BASE_SOCKET_URL } from "@/types/utils";
import { Notification } from "@/types/notification";

const SOCKET_URL = BASE_SOCKET_URL || "http://localhost:5000";

// ✅ Socket event interfaces
interface FriendRequestReceivedEvent {
  requestId: string;
  sender: {
    _id: string;
    displayName: string;
    avatar?: string;
  };
  createdAt: string;
}

interface FriendRequestAcceptedEvent {
  acceptedBy: {
    _id: string;
    displayName: string;
    avatar?: string;
  };
  requestId: string;
  receiverInfo?: {
    _id: string;
    displayName: string;
    avatar?: string;
  };
}

interface FriendRequestRejectedEvent {
  rejectedBy: {
    _id: string;
    displayName: string;
  };
  requestId: string;
}

interface FriendRequestRemovedEvent {
  requestId: string;
}

interface FriendListUpdatedEvent {
  newFriend: {
    _id: string;
    displayName: string;
    avatar?: string;
    bio?: string;
    isOnline?: boolean;
  };
}

interface FriendRemovedEvent {
  removedFriendId: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token || !user?._id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("✅ Socket connected:", socketInstance.id);

      // ✅ QUAN TRỌNG: Setup user room để nhận events
      const userId = user._id || user.id;
      console.log("🔧 Setting up socket room for user:", userId);
      socketInstance.emit("setup", userId);

      setIsConnected(true);
      toast.success("Kết nối thành công");
    });

    // ✅ Listen for setup confirmation
    socketInstance.on("connected", () => {
      console.log("✅ Socket room setup successful");
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      setIsConnected(false);
      toast.info("Mất kết nối");
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
      toast.error("Lỗi kết nối socket");
    });

    // 🔍 Debug: Log tất cả socket events
    socketInstance.onAny((eventName, ...args) => {
      console.log(`📡 Socket event received: ${eventName}`, args);
    });

    // ✅ Real-time friend request received
    socketInstance.on(
      "friend_request_received",
      (data: FriendRequestReceivedEvent) => {
        console.log("✅ Socket: Friend request received:", data);

        // Đơn giản hóa: chỉ invalidate để refetch từ server
        queryClient.invalidateQueries({ queryKey: ["friend-requests"] });

        toast.info(
          `${data.sender?.displayName || "Ai đó"} đã gửi lời mời kết bạn`,
        );
      },
    );

    // ✅ Real-time friend request accepted
    socketInstance.on(
      "friend_request_accepted",
      (data: FriendRequestAcceptedEvent) => {
        console.log("✅ Socket: Friend request accepted:", data);

        // Đơn giản hóa: chỉ invalidate để refetch từ server
        queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
        queryClient.invalidateQueries({ queryKey: ["contacts"] });

        toast.success(
          `${data.receiverInfo?.displayName || data.acceptedBy?.displayName || "Người dùng"} đã chấp nhận lời mời kết bạn`,
        );
      },
    );

    // ✅ Real-time friend request rejected (người gửi nhận event)
    socketInstance.on(
      "friend_request_rejected",
      (data: FriendRequestRejectedEvent) => {
        console.log("✅ Socket: Friend request rejected:", data);

        // Xóa khỏi sent requests
        queryClient.invalidateQueries({ queryKey: ["friend-requests"] });

        toast.info(
          `${data.rejectedBy?.displayName || "Người dùng"} đã từ chối lời mời`,
        );
      },
    );

    // ✅ Real-time friend request removed (người nhận nhận event khi tự từ chối)
    socketInstance.on(
      "friend_request_removed",
      (data: FriendRequestRemovedEvent) => {
        console.log("✅ Socket: Friend request removed:", data);

        // Xóa khỏi pending requests
        queryClient.invalidateQueries({ queryKey: ["friend-requests"] });

        toast.success("Đã từ chối lời mời kết bạn");
      },
    );

    // ✅ Real-time friend list updated (cả 2 users nhận event này)
    socketInstance.on("friend_list_updated", (data: FriendListUpdatedEvent) => {
      console.log("✅ Socket: Friend list updated:", data);

      // Update cả friend requests và contacts
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });

      toast.success(
        `Bạn và ${data.newFriend?.displayName || "người dùng"} đã là bạn bè`,
      );
    });

    // ✅ Real-time friend removed
    socketInstance.on("friend_removed", (data: FriendRemovedEvent) => {
      console.log("✅ Socket: Friend removed:", data);

      // Update contacts list
      queryClient.invalidateQueries({ queryKey: ["contacts"] });

      toast.info("Một người bạn đã xóa bạn khỏi danh sách");
    });

    // Real-time notifications (keep for other notification types)
    socketInstance.on("notification:new", (notification: Notification) => {
      console.log("✅ Socket: New notification received:", notification);

      // Đơn giản hóa: chỉ invalidate để refetch từ server
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      // Show toast based on notification type
      if (notification.type === "like") {
        toast.info("Ai đó đã thích bài viết của bạn");
      } else if (notification.type === "message") {
        toast.info("Bạn có tin nhắn mới");
      } else if (notification.type !== "friend_request") {
        // Don't show toast for friend_request as it's handled by friend_request_received
        toast.info(notification.message);
      }
    });

    // Real-time like event
    socketInstance.on("post:liked", ({ postId }: { postId: string }) => {
      queryClient.invalidateQueries({ queryKey: ["posts", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.off("connected");
      socketInstance.off("friend_request_received");
      socketInstance.off("friend_request_accepted");
      socketInstance.off("friend_request_rejected");
      socketInstance.off("friend_request_removed");
      socketInstance.off("friend_list_updated");
      socketInstance.off("friend_removed");
      socketInstance.off("notification:new");
      socketInstance.off("post:liked");
      socketInstance.offAny();
      socketInstance.disconnect();
    };
  }, [token, user, queryClient]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
