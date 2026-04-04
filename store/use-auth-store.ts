"use client";

import { User } from "@/types/user";
import { RememberedAccount } from "@/types/auth";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: User | null;
  token: string | null;
  role: string | null;
  rememberToken: string | null;
  rememberedAccounts: RememberedAccount[];
  setAuth: (
    user: User,
    token: string,
    role?: string,
    rememberToken?: string,
  ) => void;
  addRememberedAccount: (account: RememberedAccount) => void;
  removeRememberedAccount: (rememberToken: string) => void;
  logout: () => void;
}

// Helper to set auth cookie
const setAuthCookie = (token: string) => {
  document.cookie = `auth-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
};

// Helper to remove auth cookie
const removeAuthCookie = () => {
  document.cookie = "auth-token=; path=/; max-age=0";
  document.cookie = "user-role=; path=/; max-age=0";
};

// Helper to set role cookie
const setRoleCookie = (role: string) => {
  document.cookie = `user-role=${role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      rememberToken: null,
      rememberedAccounts: [],
      setAuth: (user, token, role, rememberToken) => {
        set({
          user,
          token,
          role: role ?? null,
          rememberToken: rememberToken ?? null,
        });
        setAuthCookie(token);
        if (role) setRoleCookie(role);
        // Trigger storage event để sync với tabs khác
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth-updated"));
        }
      },
      addRememberedAccount: (account) => {
        set((state) => {
          // Remove existing account with same token to avoid duplicates
          const filtered = state.rememberedAccounts.filter(
            (a) => a.rememberToken !== account.rememberToken,
          );
          // Keep only latest 3 accounts
          const updated = [account, ...filtered].slice(0, 3);
          return {
            rememberedAccounts: updated,
          };
        });
      },
      removeRememberedAccount: (rememberToken) => {
        set((state) => ({
          rememberedAccounts: state.rememberedAccounts.filter(
            (a) => a.rememberToken !== rememberToken,
          ),
        }));
      },
      logout: () => {
        set({ user: null, token: null, role: null, rememberToken: null });
        removeAuthCookie();
        // Keep rememberedAccounts
      },
    }),
    { name: "auth-storage" },
  ),
);

// Sync auth state giữa các tabs
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "auth-storage" && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        useAuthStore.setState(data.state);
      } catch (error) {
        console.error("Failed to sync auth state:", error);
      }
    }
  });
}
