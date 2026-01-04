import api from "@/lib/axios";
import { User } from "@/types/user";

export interface ContactsResponse {
  contacts: User[];
}

export const contactService = {
  getContacts: async () => {
    const res = await api.get<ContactsResponse>("/users/contacts");
    return res.data;
  },

  getFriendRequests: async () => {
    const res = await api.get("/users/friend-requests/pending");
    return res.data;
  },

  sendFriendRequest: async (userId: string) => {
    const res = await api.post(`/users/friend-requests/${userId}`);
    return res.data;
  },

  acceptFriendRequest: async (requestId: string) => {
    const res = await api.put(`/users/friend-requests/${requestId}/accept`);
    return res.data;
  },

  rejectFriendRequest: async (requestId: string) => {
    const res = await api.put(`/users/friend-requests/${requestId}/reject`);
    return res.data;
  },

  removeFriend: async (userId: string) => {
    const res = await api.delete(`/users/friends/${userId}`);
    return res.data;
  },
};
