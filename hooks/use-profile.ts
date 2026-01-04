"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { userService, UpdateProfilePayload } from "@/api/user";
import { useAuthStore } from "@/store/use-auth-store";
import { validateImageFile } from "@/lib/cloudinary";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: async (data: UpdateProfilePayload & { avatarFile?: File; coverFile?: File }) => {
      const { avatarFile, coverFile, ...profileData } = data;

      return userService.updateProfile(profileData);
    },

    onSuccess: (response) => {
      const token = useAuthStore.getState().token;
      if (token) {
        setAuth(response.user, token);
      }

      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });

      toast.success("Hồ sơ đã được cập nhật");
    },

    onError: (error: any) => {
      const message = error?.response?.data?.message || "Không thể cập nhật hồ sơ";
      toast.error(message);
      console.error("Profile update error:", error);
    },
  });
};

export const useUpdateAvatar = () => {
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: async (avatarFile: File) => {
      validateImageFile(avatarFile);
      return userService.updateAvatar(avatarFile);
    },

    onSuccess: (response) => {
      const token = useAuthStore.getState().token;
      if (token) {
        setAuth(response.user, token);
      }
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Avatar đã được cập nhật");
    },

    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Không thể cập nhật avatar");
    },
  });
};

export const useUpdateCoverImage = () => {
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: async (coverFile: File) => {
      validateImageFile(coverFile);
      return userService.updateCoverImage(coverFile);
    },

    onSuccess: (response) => {
      const token = useAuthStore.getState().token;
      if (token) {
        setAuth(response.user, token);
      }
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Ảnh bìa đã được cập nhật");
    },

    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Không thể cập nhật ảnh bìa");
    },
  });
};
