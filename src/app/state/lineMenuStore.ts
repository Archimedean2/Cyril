import { create } from 'zustand';

export type LineMenuLineType = 'lyric' | 'speaker' | 'stageDirection';

export interface LineMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  linePos: number;
  lineType: LineMenuLineType;
}

interface LineMenuStore extends LineMenuState {
  open: (data: Omit<LineMenuState, 'isOpen'>) => void;
  close: () => void;
}

export const useLineMenuStore = create<LineMenuStore>((set) => ({
  isOpen: false,
  x: 0,
  y: 0,
  linePos: 0,
  lineType: 'lyric',

  open: (data) => set({ isOpen: true, ...data }),
  close: () => set({ isOpen: false }),
}));
