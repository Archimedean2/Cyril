import { create } from 'zustand';

export interface SectionMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  sectionPos: number;
  sectionType: string;
  customLabel: string;
}

interface SectionMenuStore extends SectionMenuState {
  open: (data: Omit<SectionMenuState, 'isOpen'>) => void;
  close: () => void;
}

export const useSectionMenuStore = create<SectionMenuStore>((set) => ({
  isOpen: false,
  x: 0,
  y: 0,
  sectionPos: 0,
  sectionType: 'verse',
  customLabel: '',

  open: (data) => set({ isOpen: true, ...data }),
  close: () => set({ isOpen: false }),
}));
