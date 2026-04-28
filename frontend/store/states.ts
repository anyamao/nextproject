// frontend/store/states.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

// ✅ Тип пользователя с avatar_url
export type AppUser = {
  id: number;
  email: string;
  username: string;
  avatar_url?: string; // ✅ Обязательно для аватарок!
  status?: string;
  created_at?: string | null;
};

interface ContactFormData {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  [key: string]: string | undefined;
}

interface ContactState {
  // Контактная форма
  contactState: boolean;
  setContactState: (state: boolean) => void;
  toggleContact: () => void;
  contactData: ContactFormData | null;
  updateContactData: (data: ContactFormData) => void;

  // Навигация
  navigationState: boolean;
  toggleNavigation: () => void;

  // AI Space
  aispaceState: boolean;
  toggleAiSpace: () => void;
  aisidebarState: boolean;
  toggleAiSidebar: () => void;

  // Профиль
  profilenavigationState: boolean;
  toggleprofilenavigation: () => void;

  // Предметы
  mathnavigationState: boolean;
  togglemathNavigation: () => void;
  englishnavigationState: boolean;
  toggleenglishNavigation: () => void;

  // Авторизация
  forgotpasswordState: boolean;
  toggleforgotpassword: () => void;
  registerState: boolean;
  toggleRegister: () => void;
  loginState: boolean;
  toggleLogin: () => void;
  passwordState: boolean;
  togglePassword: () => void;

  // 👤 Пользователь
  user: AppUser | null;
  setUser: (user: AppUser | null) => void;
  isAuthenticated: boolean;

  // Утилиты
  closeEverything: () => void;
  openLogin: () => void;
  openRegister: () => void;
  logout: () => void;
}

// ✅ Инициализация store с persist (сохранение в localStorage)
const useContactStore = create<ContactState>()(
  persist(
    (set) => ({
      // Контактная форма
      contactState: false,
      setContactState: (state) => set({ contactState: state }),
      toggleContact: () =>
        set((state) => ({ contactState: !state.contactState })),
      contactData: null,
      updateContactData: (data) => set({ contactData: data }),

      // Навигация
      navigationState: false,
      toggleNavigation: () =>
        set((state) => ({ navigationState: !state.navigationState })),

      // AI Space
      aispaceState: false,
      toggleAiSpace: () =>
        set((state) => ({ aispaceState: !state.aispaceState })),
      aisidebarState: false,
      toggleAiSidebar: () =>
        set((state) => ({ aisidebarState: !state.aisidebarState })),

      // Профиль
      profilenavigationState: false,
      toggleprofilenavigation: () =>
        set((state) => ({
          profilenavigationState: !state.profilenavigationState,
        })),

      // Предметы
      mathnavigationState: true,
      togglemathNavigation: () =>
        set((state) => ({ mathnavigationState: !state.mathnavigationState })),
      englishnavigationState: false,
      toggleenglishNavigation: () =>
        set((state) => ({
          englishnavigationState: !state.englishnavigationState,
        })),

      // Авторизация
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

      // 👤 Пользователь — ИНИЦИАЛИЗАЦИЯ ИЗ localStorage
      user: null,
      isAuthenticated: false,

      setUser: (userData) => {
        if (userData) {
          // ✅ Сохраняем ВСЕ поля, включая avatar_url
          set({
            user: {
              id: userData.id,
              email: userData.email,
              username: userData.username,
              avatar_url: userData.avatar_url || "default_cat.jpg", // ✅ Дефолт если нет
              status: userData.status,
              created_at: userData.created_at,
            },
            isAuthenticated: true,
          });
        } else {
          set({
            user: null,
            isAuthenticated: false,
          });
        }
      },

      logout: () => {
        // ✅ Очищаем всё при выходе
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
        set({
          user: null,
          isAuthenticated: false,
          loginState: false,
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
      name: "maoschool-storage", // ключ в localStorage
      partialize: (state) => ({
        // ✅ Сохраняем только пользователя и авторизацию
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useContactStore;
