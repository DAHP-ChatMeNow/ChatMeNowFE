import api from "@/lib/axios";
import { Notification } from "@/types/notification";

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// Helper function to map _id to id for MongoDB compatibility
const mapMongoId = (obj: any): any => {
  if (!obj) return obj;
  
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    return {
      ...obj,
      id: obj._id || obj.id,
    };
  }
  
  return obj;
};

export const notificationService = {
  getNotifications: async () => {
    const res = await api.get<any>("/notifications");
    // Map notifications to ensure referenced has proper ID format
    const notifications = res.data.notifications?.map((noti: any) => ({
      ...noti,
      id: noti._id || noti.id,
      referenced: noti.referenced ? (noti.referenced._id || noti.referenced) : undefined,
    })) || [];
    
    return {
      notifications,
      unreadCount: res.data.unreadCount || 0,
    };
  },

  markAsRead: async (notificationId: string) => {
    const res = await api.put(`/notifications/${notificationId}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await api.put("/notifications/read-all");
    return res.data;
  },

  deleteNotification: async (notificationId: string) => {
    const res = await api.delete(`/notifications/${notificationId}`);
    return res.data;
  },
};
