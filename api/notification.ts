import api from "@/lib/axios";
import { Notification } from "@/types/notification";

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export const notificationService = {
  getNotifications: async () => {
    const res = await api.get<NotificationsResponse>("/notifications");
    return res.data;
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
