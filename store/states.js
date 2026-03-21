import { create } from "zustand";

const useContactStore = create((set) => ({
  contactState: false,
  setContactState: (state) => set({ contactState: state }),
  toggleContact: () => set((state) => ({ contactState: !state.contactState })),
  updateContactData: (data) => set({ contactData: data }),

  navigationState: false,
  toggleNavigation: () =>
    set((state) => ({ navigationState: !state.navigationState })),
  closeEverything: () =>
    set((state) => ({
      navigationState: false,
      mathnavigationState: false,
      englishnavigationState: false,
      contactState: false,
      registerState: false,
    })),

  loginState: false,
  toggleLogin: () => set((state) => ({ loginState: !state.logintState })),

  loggedState: false,
  toggleLogged: () => set((state) => ({ loggedState: !state.loggedState })),
  registerState: false,
  toggleRegister: () =>
    set((state) => ({ registerState: !state.registerState })),

  //mathnavigationState: true,
  //togglemathNavigation: () =>
  //set((state) => ({ mathnavigationState: !state.mathnavigationState })),
  //englishnavigationState: true,

  //toggleenglishNavigation: () =>
  //set((state) => ({ englishnavigationState: !state.englishnavigationState })),
}));

export default useContactStore;
