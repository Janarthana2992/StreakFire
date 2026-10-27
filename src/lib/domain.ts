import type { Data, DayInfo, DayTask, Priority } from './types';
import { dow0, eachDay, shift, today } from './dates';

export const ALL = [0, 1, 2, 3, 4, 5, 6];
export const WEEKDAYS = [0, 1, 2, 3, 4];
export const DOW_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function repeatLabel(days?: number[]) {
  if (!days || days.length === 7) return 'Daily';
  const k = [...days].sort().join('');
  if (k === '01234') return 'Weekdays';
  if (k === '56') return 'Weekends';
  return [...days].sort().map((i) => DOW_SHORT[i]).join(', ');
}

/* Derived values are cached per immutable Data object, so every screen can call these freely. */
const caches = new WeakMap<Data, Map<string, unknown>>();
function memo<T>(D: Data, key: string, fn: () => T): T {
  let c = caches.get(D);
  if (!c) { c = new Map(); caches.set(D, c); }
  if (c.has(key)) return c.get(key) as T;
  const v = fn(); c.set(key, v); return v;
}

const PR: Record<Priority, number> = { high: 0, medium: 1, low: 2, '': 3 };

export function tasksFor(D: Data, d: string): DayTask[] {
  return memo(D, 't' + d, () => {
    const wd = dow0(d);
    const r: DayTask[] = D.routines.filter((x) => x.from <= d && (!x.to || d < x.to) && x.days.includes(wd)).map((x) => ({ ...x, routine: true }));
    const t: DayTask[] = D.tasks.filter((x) => x.date === d).map((x) => ({ ...x, routine: false }));
    return [...r, ...t].sort((a, b) =>
      a.time && b.time ? a.time.localeCompare(b.time) : a.time ? -1 : b.time ? 1 : PR[a.priority] - PR[b.priority] || a.title.localeCompare(b.title));
  });
}
export const isDone = (D: Data, d: string, id: string) => (D.done[d] || []).includes(id);
export const subIsDone = (D: Data, d: string, tid: string, sid: string) => ((D.subDone[d] || {})[tid] || []).includes(sid);

export function info(D: Data, d: string): DayInfo {
  return memo(D, 'i' + d, () => {
    const ts = tasksFor(D, d);
    const done = ts.filter((t) => isDone(D, d, t.id)).length;
    const rest = !!D.rest[d];
    const counts = ts.length > 0 && !rest;
    const pct = ts.length ? done / ts.length : 0;
    return { total: ts.length, done, pct, rest, counts, complete: counts && pct >= D.goal / 100 - 1e-9 };
  });
}

export function firstDate(D: Data) {
  return memo(D, 'first', () => {
    let f = today();
    D.routines.forEach((r) => { if (r.from < f) f = r.from; });
    D.tasks.forEach((t) => { if (t.date < f) f = t.date; });
    return f;
  });
}

/** Consecutive days that hit the goal. Rest days and days with no tasks are skipped, not broken. Today only counts once it is hit. */
export function streak(D: Data) {
  return memo(D, 'streak', () => {
    let d = today();
    if (!info(D, d).complete) d = shift(d, -1);
    const f = firstDate(D);
    let n = 0;
    for (let guard = 0; d >= f && guard < 5000; guard++) {
      const i = info(D, d);
      if (i.complete) n++; else if (i.counts) break;
      d = shift(d, -1);
    }
    return n;
  });
}
export function bestStreak(D: Data) {
  return memo(D, 'best', () => {
    let run = 0, best = 0; const end = today();
    eachDay(firstDate(D), end, (d) => {
      const i = info(D, d);
      if (i.complete) { run++; best = Math.max(best, run); } else if (i.counts && d !== end) run = 0;
    });
    return best;
  });
}
export function countComplete(D: Data, from: string, to: string) {
  let n = 0; const f = firstDate(D);
  eachDay(from < f ? f : from, to, (d) => { if (info(D, d).complete) n++; });
  return n;
}
export function focusMins(D: Data, from = '0000-01-01', to = '9999-12-31') {
  let n = 0;
  for (const [d, v] of Object.entries(D.focus)) if (d >= from && d <= to) n += v.m || 0;
  return n;
}
export function xp(D: Data) {
  return memo(D, 'xp', () => {
    let n = 0; const t = today();
    for (const d of Object.keys(D.done)) if (d <= t) n += info(D, d).done * 10;
    n += D.todos.filter((x) => x.done).length * 5;
    n += focusMins(D);
    return n;
  });
}
export const LVL = 300;
export const level = (D: Data) => Math.floor(xp(D) / LVL) + 1;
export const levelPct = (D: Data) => (xp(D) % LVL) / LVL;
const LEVEL_NAMES = ['Spark', 'Kindling', 'Flame', 'Blaze', 'Bonfire', 'Wildfire', 'Inferno', 'Supernova'];
export const levelName = (l: number) => LEVEL_NAMES[Math.min(LEVEL_NAMES.length - 1, Math.floor((l - 1) / 2))];

export const overdueTodos = (D: Data) => { const t = today(); return D.todos.filter((x) => !x.done && x.deadline && x.deadline < t); };
export const todosDue = (D: Data, d: string) => D.todos.filter((x) => x.deadline === d);

/* ----- mutations (call inside store.update, which hands you a fresh copy) ----- */
export function toggleDone(D: Data, d: string, id: string) {
  const a = D.done[d] || (D.done[d] = []);
  const i = a.indexOf(id);
  if (i >= 0) a.splice(i, 1); else a.push(id);
  if (!a.length) delete D.done[d];
}
export function toggleSub(D: Data, d: string, tid: string, sid: string) {
  const m = D.subDone[d] || (D.subDone[d] = {});
  const a = m[tid] || (m[tid] = []);
  const i = a.indexOf(sid);
  if (i >= 0) a.splice(i, 1); else a.push(sid);
}
export function logFocus(D: Data, id: string, m: number) {
  if (m < 1) return;
  const d = today();
  const f = D.focus[d] || (D.focus[d] = { m: 0, by: {} });
  f.m += m;
  if (id) { f.by = f.by || {}; f.by[id] = (f.by[id] || 0) + m; }
}

export const QUOTES = [
  'Every day is a new chance to build the life you want. Start with one task.',
  'Small steps, taken daily, outrun big plans taken rarely.',
  'You do not need a perfect day. You need a finished one.',
  'Consistency beats intensity when the calendar is long.',
  'Do the smallest version today. Tomorrow will thank you.',
  'Momentum is built, not found.',
  'A streak is a promise you keep to yourself.',
  'Show up first. Get good later.',
  'Progress hides in the boring repetitions.',
  'Protect the chain. Even one link counts.',
];

export interface Badge { k: string; d: number; n: string; t: string; type: 'streak' | 'focus' | 'todo' }
export const BADGES: Badge[] = [
  { k: 's3', d: 3, n: 'Spark', t: '3-day streak', type: 'streak' },
  { k: 's7', d: 7, n: 'Week Warrior', t: '7-day streak', type: 'streak' },
  { k: 's14', d: 14, n: 'Fortnight Flame', t: '14-day streak', type: 'streak' },
  { k: 's21', d: 21, n: 'Habit Formed', t: '21-day streak', type: 'streak' },
  { k: 's30', d: 30, n: 'Monthly Master', t: '30-day streak', type: 'streak' },
  { k: 's50', d: 50, n: 'Half-Century', t: '50-day streak', type: 'streak' },
  { k: 's100', d: 100, n: 'Centurion', t: '100-day streak', type: 'streak' },
  { k: 's365', d: 365, n: 'Year of Fire', t: '365-day streak', type: 'streak' },
  { k: 'f1', d: 60, n: 'Deep Diver', t: '1 hour of focus', type: 'focus' },
  { k: 'f10', d: 600, n: 'Flow State', t: '10 hours of focus', type: 'focus' },
  { k: 'f50', d: 3000, n: 'Monk Mode', t: '50 hours of focus', type: 'focus' },
  { k: 't50', d: 50, n: 'Closer', t: '50 todos finished', type: 'todo' },
];
export function badgeProgress(D: Data, b: Badge) {
  const v = b.type === 'streak' ? bestStreak(D) : b.type === 'focus' ? focusMins(D) : D.todos.filter((x) => x.done).length;
  return { v, earned: v >= b.d, pct: Math.min(1, v / b.d) };
}

export const CATS = { personal: 'Personal', ideas: 'Ideas', work: 'Work', goals: 'Goals', habits: 'Habits' } as const;
export const COLORS = ['yellow', 'pink', 'blue', 'green', 'purple'] as const;
export const PRI = {
  high: { l: 'High', c: 'bad' },
  medium: { l: 'Medium', c: 'warn' },
  low: { l: 'Low', c: 'sky' },
} as const;
