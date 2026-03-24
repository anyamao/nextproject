import { create } from "zustand";
import { User } from "@supabase/supabase-js";

interface ContactFormData {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  [key: string]: string | undefined;
}

interface ContactState {
  // --- UI States ---
  contactState: boolean;
  setContactState: (state: boolean) => void;
  toggleContact: () => void;
  contactData: ContactFormData | null;
  updateContactData: (data: ContactFormData) => void;

  navigationState: boolean;
  toggleNavigation: () => void;

  mathnavigationState: boolean;
  togglemathNavigation: () => void;

  englishnavigationState: boolean;
  toggleenglishNavigation: () => void;

  registerState: boolean;
  toggleRegister: () => void;

  loginState: boolean;
  toggleLogin: () => void;

  passwordState: boolean;
  togglePassword: () => void;

  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;

  closeEverything: () => void;
  openLogin: () => void;
  openRegister: () => void;
  logout: () => void;
}

const useContactStore = create<ContactState>((set) => ({
  // --- UI States ---
  contactState: false,
  setContactState: (state) => set({ contactState: state }),
  toggleContact: () => set((state) => ({ contactState: !state.contactState })),
  contactData: null,
  updateContactData: (data) => set({ contactData: data }),

  navigationState: false,
  toggleNavigation: () =>
    set((state) => ({ navigationState: !state.navigationState })),

  mathnavigationState: true,
  togglemathNavigation: () =>
    set((state) => ({ mathnavigationState: !state.mathnavigationState })),

  englishnavigationState: true,
  toggleenglishNavigation: () =>
    set((state) => ({ englishnavigationState: !state.englishnavigationState })),

  registerState: false,
  toggleRegister: () =>
    set((state) => ({ registerState: !state.registerState })),

  loginState: false,
  toggleLogin: () => set((state) => ({ loginState: !state.loginState })),

  passwordState: false,
  togglePassword: () =>
    set((state) => ({ passwordState: !state.passwordState })),

  user: null,
  isAuthenticated: false,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      loginState: false,
    }),

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
    }),
}));

export default useContactStore;
