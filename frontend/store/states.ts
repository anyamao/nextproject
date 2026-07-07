// store/states.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch } from "@/lib/api";

export type AppUser = {
  id: number;
  email: string;
  username: string;
  avatar_url?: string;
  status?: string;
  created_at?: string | null;
  equipped_item?: {
    id: number;
    name: string;
    image: string;
    price: number;
    description: string | null;
  } | null;
};

interface ContactFormData {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  [key: string]: string | undefined;
}

interface ContactState {
  tokenBalance: number;
  setTokenBalance: (balance: number) => void;
  addTokens: (amount: number) => void;
  contactState: boolean;
  setContactState: (state: boolean) => void;
  toggleContact: () => void;
  contactData: ContactFormData | null;
  updateContactData: (data: ContactFormData) => void;

  navigationState: boolean;
  toggleNavigation: () => void;

  aispaceState: boolean;
  toggleAiSpace: () => void;
  aisidebarState: boolean;
  toggleAiSidebar: () => void;

  profilenavigationState: boolean;
  toggleprofilenavigation: () => void;

  mathnavigationState: boolean;
  togglemathNavigation: () => void;
  englishnavigationState: boolean;
  toggleenglishNavigation: () => void;

  coursenavigationState: boolean;
  togglecourseNavigation: () => void;
  forgotpasswordState: boolean;
  toggleforgotpassword: () => void;
  registerState: boolean;
  toggleRegister: () => void;
  loginState: boolean;
  toggleLogin: () => void;
  passwordState: boolean;
  togglePassword: () => void;

  user: AppUser | null;
  setUser: (user: AppUser | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;

  closeEverything: () => void;
  openLogin: () => void;
  openRegister: () => void;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearUser: () => void;
}

const useContactStore = create<ContactState>()(
  persist(
    (set, get) => ({
      // ====== ТОКЕНЫ ======
      tokenBalance: 0,
      setTokenBalance: (balance) => set({ tokenBalance: balance }),
      addTokens: (amount) =>
        set((state) => ({ tokenBalance: state.tokenBalance + amount })),

      // ====== КОНТАКТЫ ======
      contactState: false,
      setContactState: (state) => set({ contactState: state }),
      toggleContact: () =>
        set((state) => ({ contactState: !state.contactState })),
      contactData: null,
      updateContactData: (data) => set({ contactData: data }),

      // ====== НАВИГАЦИЯ ======
      navigationState: false,
      toggleNavigation: () =>
        set((state) => ({ navigationState: !state.navigationState })),

      aispaceState: false,
      toggleAiSpace: () =>
        set((state) => ({ aispaceState: !state.aispaceState })),
      aisidebarState: false,
      toggleAiSidebar: () =>
        set((state) => ({ aisidebarState: !state.aisidebarState })),

      profilenavigationState: false,
      toggleprofilenavigation: () =>
        set((state) => ({
          profilenavigationState: !state.profilenavigationState,
        })),

      mathnavigationState: true,
      togglemathNavigation: () =>
        set((state) => ({ mathnavigationState: !state.mathnavigationState })),
      englishnavigationState: false,
      toggleenglishNavigation: () =>
        set((state) => ({
          englishnavigationState: !state.englishnavigationState,
        })),

      coursenavigationState: true,
      togglecourseNavigation: () =>
        set((state) => ({
          coursenavigationState: !state.coursenavigationState,
        })),

      // ====== МОДАЛЬНЫЕ ОКНА ======
      forgotpasswordState: false,
      toggleforgotpassword: () =>
        set((state) => ({ forgotpasswordState: !state.forgotpasswordState })),
      registerState: false,
      toggleRegister: () =>
        set((state) => ({ registerState: !state.registerState })),
      loginState: false,
      toggleLogin: () => set((state) => ({ loginState: !state.loginState })),
      passwordState: false,
      togglePassword: () =>
        set((state) => ({ passwordState: !state.passwordState })),

      // ====== ПОЛЬЗОВАТЕЛЬ ======
      user: null,
      isAuthenticated: false,
      isLoading: true,

      // 🔥 ИСПРАВЛЕНО: setUser теперь корректно устанавливает состояние
      setUser: (userData) => {
        if (!userData || !userData.id || userData.id === 0) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        const newUser = {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          avatar_url: userData.avatar_url || "default_cat.jpg",
          status: userData.status,
          created_at: userData.created_at,
          equipped_item: userData.equipped_item || null,
        };

        set({
          user: newUser,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      // 🔥 ИСПРАВЛЕНО: login устанавливает состояние после успешного входа
      login: async (email: string, password: string) => {
        try {
          const base_url =
            typeof window !== "undefined"
              ? window.location.hostname === "maoschool.ru"
                ? ""
                : "http://localhost:8010"
              : "http://localhost:8010";

          const response = await fetch(`${base_url}/api/v1/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
            credentials: "include",
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || "Failed to log in");
          }

          const data = await response.json();

          if (data?.user) {
            // 🔥 Устанавливаем пользователя через setUser
            const newUser = {
              id: data.user.id,
              email: data.user.email,
              username: data.user.username,
              avatar_url: data.user.avatar_url || "default_cat.jpg",
              status: data.user.status,
              created_at: data.user.created_at,
            };

            set({
              user: newUser,
              isAuthenticated: true,
              loginState: false,
              isLoading: false,
            });

            return data;
          }
          throw new Error("Invalid response from server");
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // store/states.ts - обновленный метод logout
      // store/states.ts - добавить метод

      forceLogout: () => {
        // Очищаем localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("maoschool-storage");
        }

        // Очищаем состояние
        set({
          user: null,
          isAuthenticated: false,
          loginState: false,
          isLoading: false,
        });

        // Редирект
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
      },
      logout: async () => {
        try {
          // 🔥 ПРЯМОЙ FETCH без apiFetch (чтобы избежать рекурсии)
          const base_url =
            typeof window !== "undefined"
              ? window.location.hostname === "maoschool.ru"
                ? ""
                : "http://localhost:8010"
              : "http://localhost:8010";

          await fetch(`${base_url}/api/v1/auth/logout`, {
            method: "POST",
            credentials: "include", // 🔥 ВАЖНО: отправляем cookie
          });
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          // 🔥 ВСЕГДА очищаем состояние, даже если запрос не удался
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            // 🔥 Очищаем maoschool-storage
            localStorage.removeItem("maoschool-storage");
          }
          set({
            user: null,
            isAuthenticated: false,
            loginState: false,
            isLoading: false,
          });

          // 🔥 Редирект на главную
          if (typeof window !== "undefined") {
            window.location.href = "/";
          }
        }
      },
      // 🔥 ИСПРАВЛЕНО: checkAuth проверяет авторизацию через бэкенд
      checkAuth: async () => {
        try {
          const data = await apiFetch("/auth/me");

          if (data?.user) {
            const newUser = {
              id: data.user.id,
              email: data.user.email,
              username: data.user.username,
              avatar_url: data.user.avatar_url || "default_cat.jpg",
              status: data.user.status,
              created_at: data.user.created_at,
            };

            set({
              user: newUser,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearUser: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      closeEverything: () =>
        set({
          navigationState: false,
          mathnavigationState: false,
          englishnavigationState: false,
          contactState: false,
          registerState: false,
          loginState: false,
        }),

      openLogin: () =>
        set({
          loginState: true,
          registerState: false,
        }),

      openRegister: () =>
        set({
          loginState: false,
          registerState: true,
          forgotpasswordState: false,
        }),
    }),
    {
      name: "maoschool-storage",
      partialize: (state) => ({
        tokenBalance: state.tokenBalance,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Rehydration error:", error);
          return;
        }

        // 🔥 Восстанавливаем состояние после загрузки
        if (state?.user) {
          if (!state.user.avatar_url) {
            state.user.avatar_url = "default_cat.jpg";
          }
          state.isAuthenticated = true;
        } else {
          state.isAuthenticated = false;
        }
        state.isLoading = false;
      },
    },
  ),
);

export default useContactStore;
