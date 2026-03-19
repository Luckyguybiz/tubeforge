import { create } from 'zustand';

interface MobileMenuState {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  close: () => void;
}

export const useMobileMenuStore = create<MobileMenuState>((set) => ({
  open: false,
  setOpen: (v) => set({ open: v }),
  toggle: () => set((s) => ({ open: !s.open })),
  close: () => set({ open: false }),
}));
