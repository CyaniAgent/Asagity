import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile, AuthData } from "@/types/models";

interface UserState {
  isLoggedIn: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  username: string;
  avatar: string;
  isAdmin: boolean;
  isModerator: boolean;
  setAuth: (data: AuthData) => void;
  developerEnter: () => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  fetchMe: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      accessToken: null,
      refreshToken: null,
      user: null,

      get username() {
        return get().user?.username || "";
      },

      get avatar() {
        return get().user?.avatar_url || "";
      },

      get isAdmin() {
        return get().user?.role === "admin" || get().user?.username === "Developer";
      },

      get isModerator() {
        return get().user?.role === "moderator" || get().isAdmin;
      },

      setAuth: (data: AuthData) =>
        set({
          isLoggedIn: true,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          user: data.user,
        }),

      developerEnter: () =>
        set({
          isLoggedIn: true,
          accessToken: "dev_mock_token_39",
          refreshToken: "dev_mock_refresh_39",
          user: {
            username: "Developer",
            name: "Asagity Dev",
            avatar_url: "https://avatars.githubusercontent.com/u/739984?v=4",
          },
        }),

      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {
          // Ignore logout errors
        }

        set({
          isLoggedIn: false,
          accessToken: null,
          refreshToken: null,
          user: null,
        });
      },

      logoutAll: async () => {
        try {
          await fetch("/api/auth/logout-all", { method: "POST" });
        } catch {
          // Ignore logout errors
        }

        set({
          isLoggedIn: false,
          accessToken: null,
          refreshToken: null,
          user: null,
        });
      },

      refreshAccessToken: async () => {
        try {
          const res = await fetch("/api/auth/refresh", { method: "POST" });
          if (!res.ok) return false;
          const data = await res.json();
          if (data.ok && data.data) {
            set({
              accessToken: data.data.access_token,
              refreshToken: data.data.refresh_token,
            });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      fetchMe: async () => {
        const state = get();
        if (!state.accessToken) return;

        if (state.accessToken === "dev_mock_token_39") {
          set({ isLoggedIn: true });
          return;
        }

        try {
          const res = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${state.accessToken}`,
            },
          });

          if (!res.ok) throw new Error("Failed to fetch user");

          const result = await res.json();
          if (result.ok && result.data) {
            set({
              user: result.data,
              isLoggedIn: true,
            });
          } else {
            throw new Error(result?.error?.message || "Failed to fetch user");
          }
        } catch (err) {
          console.error("Failed to fetch user profile:", err);

          const errMsg = (err as Error).message || "";
          if (
            errMsg.toLowerCase().includes("fetch failed") ||
            errMsg.toLowerCase().includes("network error") ||
            errMsg.toLowerCase().includes("failed to fetch")
          ) {
            // Offline fallback handled by system store
          } else {
            const refreshed = await get().refreshAccessToken();
            if (!refreshed) {
              get().logout();
            } else {
              await get().fetchMe();
            }
          }
        }
      },
    }),
    {
      name: "asagity-user",
    }
  )
);
