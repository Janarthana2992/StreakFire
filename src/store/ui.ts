import { create } from 'zustand';
import type { Priority } from '../lib/types';

export interface EditorPreset { title?: string; time?: string; priority?: Priority; kind?: 'once' | 'repeat'; days?: number[] }
export type DialogState =
  | { type: 'editor'; id?: string; date: string; preset?: EditorPreset }
  | { type: 'day'; date: string }
  | { type: 'todo'; id?: string }
  | { type: 'note'; id?: string }
  | { type: 'settings' } | { type: 'review' } | { type: 'quick' } | { type: 'shortcuts' };

interface UIStore {
  dialog: DialogState | null;
  palette: boolean;
  /** id of the item that was just ticked, for the pop animation */
  just: string | null;
  open: (d: DialogState) => void;
  close: () => void;
  setPalette: (v: boolean) => void;
  setJust: (id: string | null) => void;
}
export const useUI = create<UIStore>((set) => ({
  dialog: null, palette: false, just: null,
  open: (dialog) => set({ dialog, palette: false }),
  close: () => set({ dialog: null }),
  setPalette: (palette) => set({ palette }),
  setJust: (just) => set({ just }),
}));

/** Ticks every 30 s so "today", the Now line and reminders stay current. */
interface ClockStore { day: string; min: number }
const stamp = () => { const n = new Date(); return { day: `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`, min: n.getHours() * 60 + n.getMinutes() }; };
export const useClock = create<ClockStore>(() => stamp());
setInterval(() => useClock.setState(stamp()), 30_000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) useClock.setState(stamp()); });
