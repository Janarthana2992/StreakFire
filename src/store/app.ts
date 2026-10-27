import { create } from 'zustand';
import type { Data } from '../lib/types';
import { blank, normalize } from '../lib/seed';
import { cloudConfigured } from '../lib/firebase-config';

export const STORAGE_KEY = 'streakfire.v3'; // same key as v3, so existing local data carries over
export type SyncState = 'local' | 'saving' | 'saved' | 'offline' | 'error';
export type AuthState = 'local' | 'loading' | 'signed-out' | 'denied' | 'error' | 'ready';

function loadLocal(): Data | null {
  try {
    const r = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('streakfire.v2');
    if (r) {
      const parsed = JSON.parse(r);
      // Discard previously loaded demo/sample data so the user starts completely clean
      if (parsed && typeof parsed === 'object' && (parsed as { sample?: boolean }).sample) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('streakfire.v2');
        return null;
      }
      return normalize(parsed);
    }
  } catch { /* storage unavailable */ }
  return null;
}

interface AppStore {
  data: Data;
  sync: SyncState;
  auth: AuthState;
  authMessage: string;
  user: { email: string | null; name: string | null } | null;
  /** Apply a change to a fresh copy of the data. Returns the previous data (for undo). */
  update: (fn: (d: Data) => void) => Data;
  setData: (d: Data) => void;
}

export const useApp = create<AppStore>((set, get) => ({
  data: loadLocal() ?? blank(),
  sync: 'local',
  auth: cloudConfigured ? 'loading' : 'local',
  authMessage: '',
  user: null,
  update: (fn) => {
    const prev = get().data;
    const next = structuredClone(prev);
    fn(next);
    set({ data: next });
    return prev;
  },
  setData: (d) => set({ data: d }),
}));

/* Persist a local copy (works offline and in local mode). */
let saveT: ReturnType<typeof setTimeout> | undefined;
useApp.subscribe((s, p) => {
  if (s.data === p.data) return;
  clearTimeout(saveT);
  saveT = setTimeout(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(useApp.getState().data)); } catch { /* ignore */ } }, 150);
});
