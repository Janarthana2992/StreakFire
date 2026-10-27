import { create } from 'zustand';
import { useApp } from './app';
import { logFocus } from '../lib/domain';
import { notify } from '../lib/notify';
import { confetti } from '../lib/confetti';
import { toast } from 'sonner';

export interface FocusSession { id: string; title: string; len: number; start: number; pausedAt: number | null; pausedTotal: number }
const KEY = 'streakfire.focus';
const load = (): FocusSession | null => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
const persist = (f: FocusSession | null) => { try { if (f) localStorage.setItem(KEY, JSON.stringify(f)); else localStorage.removeItem(KEY); } catch { /* ignore */ } };

export const focusLeft = (f: FocusSession | null) => {
  if (!f) return 0;
  const now = Date.now();
  const paused = f.pausedTotal + (f.pausedAt ? now - f.pausedAt : 0);
  return Math.max(0, f.len * 60000 - (now - f.start - paused));
};

interface FocusStore {
  session: FocusSession | null;
  start: (id: string, title: string, len?: number) => void;
  pause: () => void;
  resume: () => void;
  end: (completed: boolean) => void;
}
export const useFocus = create<FocusStore>((set, get) => ({
  session: load(),
  start: (id, title, len) => {
    const s = { id, title: title || 'Focus session', len: len || useApp.getState().data.focusLen || 25, start: Date.now(), pausedAt: null, pausedTotal: 0 };
    persist(s); set({ session: s });
  },
  pause: () => { const s = get().session; if (!s || s.pausedAt) return; const n = { ...s, pausedAt: Date.now() }; persist(n); set({ session: n }); },
  resume: () => { const s = get().session; if (!s || !s.pausedAt) return; const n = { ...s, pausedTotal: s.pausedTotal + Date.now() - s.pausedAt, pausedAt: null }; persist(n); set({ session: n }); },
  end: (completed) => {
    const s = get().session; if (!s) return;
    const spent = completed ? s.len : Math.floor((s.len * 60000 - focusLeft(s)) / 60000);
    persist(null); set({ session: null });
    if (spent >= 1) useApp.getState().update((d) => logFocus(d, s.id, spent));
    if (completed) { void notify('Focus session complete', `${s.len} minutes on ${s.title}. Take a short break.`); confetti(70); }
    else if (spent >= 1) toast(`Logged ${spent} min of focus`);
  },
}));
