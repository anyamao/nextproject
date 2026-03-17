import { create } from "zustand";

const useContactStore = create((set) => ({
  contactState: false,
  setContactState: (state) => set({ contactState: state }),
  toggleContact: () => set((state) => ({ contactState: !state.contactState })),
  updateContactData: (data) => set({ contactData: data }),

  navigationState: false,
  toggleNavigation: () =>
    set((state) => ({ navigationState: !state.navigationState })),

  loginState: false,
  toggleLogin: () => set((state) => ({ loginState: !state.logintState })),

  loggedState: false,
  toggleLogged: () => set((state) => ({ loggedState: !state.loggedState })),
  registerState: false,
  toggleRegister: () =>
    set((state) => ({ registerState: !state.registerState })),

  mathnavigationState: false,
  togglemathNavigation: () =>
    set((state) => ({ mathNavigationState: !state.mathNavigationState })),
}));

export default useContactStore;
