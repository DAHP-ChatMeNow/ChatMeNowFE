import api from "@/lib/axios";
import { User } from "@/types/user";

export interface UpdateProfilePayload {
  displayName?: string;
  bio?: string;
  language?: string;
  themeColor?: string;
}

export interface UpdateProfileResponse {
  user: User;
  message: string;
}

export const userService = {
  /**
   * Get current user profile
   */
  getProfile: async () => {
    const res = await api.get<User>("/users/profile");
    return res.data;
  },

  /**
   * Update user profile
   * @param data - Profile data to update
   */
  updateProfile: async (data: UpdateProfilePayload) => {
    const res = await api.put<UpdateProfileResponse>("/users/profile", data);
    return res.data;
  },

  /**
   * Update user avatar - gửi file trực tiếp đến backend
   * Backend sẽ xử lý upload Cloudinary
   * @param file - Avatar image file
   */
  updateAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await api.put<UpdateProfileResponse>("/users/avatar", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  /**
   * Update user cover image - gửi file trực tiếp đến backend
   * Backend sẽ xử lý upload Cloudinary
   * @param file - Cover image file
   */
  updateCoverImage: async (file: File) => {
    const formData = new FormData();
    formData.append('coverImage', file);
    const res = await api.put<UpdateProfileResponse>("/users/cover", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  /**
   * Get user by ID
   */
  getUserById: async (userId: string) => {
    const res = await api.get<User>(`/users/${userId}`);
    return res.data;
  },

  /**
   * Get user profile by ID (with friends list and full info)
   */
  getUserProfile: async (userId: string) => {
    const res = await api.get<{ success: boolean; user: User }>(`/users/${userId}`);
    return res.data.user;
  },

  /**
   * Get current user's email from account
   */
  getUserEmail: async () => {
    const res = await api.get<{ 
      success: boolean; 
      email: string; 
      phoneNumber?: string; 
      displayName: string 
    }>(`/users/me/email`);
    return res.data;
  },

  /**
   * Get user's email by user ID
   */
  getUserEmailById: async (userId: string) => {
    const res = await api.get<{ 
      success: boolean; 
      email: string; 
      phoneNumber?: string; 
      displayName: string 
    }>(`/users/${userId}/email`);
    return res.data;
  },
};
