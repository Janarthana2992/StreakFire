import type { Data } from './types';
import { shift, today } from './dates';
import { ALL, WEEKDAYS, info, tasksFor } from './domain';

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);

export function blank(name = 'You'): Data {
  return {
    v: 3, name, theme: 'system', palette: 'indigo', sample: false, goal: 100, remind: false, remindAt: '09:00', focusLen: 25,
    routines: [], tasks: [], done: {}, subDone: {}, rest: {}, focus: {}, reviews: {}, carry: {}, todos: [], notes: [], quote: 0,
  };
}

/** Accepts anything (old versions, backups, partial objects) and returns valid Data. */
export function normalize(input: unknown): Data {
  const s = Object.assign(blank(), (input && typeof input === 'object' ? input : {}) as Partial<Data>) as Data;
  for (const k of ['done', 'subDone', 'rest', 'focus', 'reviews', 'carry'] as const) if (!s[k] || typeof s[k] !== 'object') (s as unknown as Record<string, object>)[k] = {};
  for (const k of ['routines', 'tasks', 'todos', 'notes'] as const) if (!Array.isArray(s[k])) (s as unknown as Record<string, unknown[]>)[k] = [];
  s.routines = s.routines.map((r) => ({ ...r, days: Array.isArray(r.days) && r.days.length ? r.days : ALL.slice(), subs: r.subs || [], priority: r.priority || '', note: r.note || '', time: r.time || '', to: r.to ?? null }));
  s.tasks = s.tasks.map((t) => ({ ...t, subs: t.subs || [], priority: t.priority || '', note: t.note || '', time: t.time || '' }));
  s.v = 3;
  return s;
}

/** Example data so every screen has something to show on first run. Clearly flagged with `sample: true`. */
export function seed(): Data {
  const t = today();
  const st = blank('Suruthi S K');
  st.sample = true; st.goal = 80;
  const f70 = shift(t, -70), f36 = shift(t, -36);
  st.routines = [
    { id: 'r1', title: 'Solve one DSA problem', from: f70, to: null, time: '07:30', days: ALL.slice(), priority: 'medium', note: 'Arrays and strings this month.', subs: [] },
    { id: 'r2', title: 'Team standup', from: f70, to: null, time: '10:00', days: WEEKDAYS.slice(), priority: 'high', note: '', subs: [] },
    { id: 'r3', title: 'Review test results & bugs', from: f36, to: null, time: '15:00', days: WEEKDAYS.slice(), priority: '', note: '', subs: [{ id: 's1', t: 'Check overnight run' }, { id: 's2', t: 'Triage new bugs' }, { id: 's3', t: 'Update tracker' }] },
    { id: 'r4', title: 'Read 20 pages', from: f70, to: null, time: '', days: ALL.slice(), priority: 'low', note: '', subs: [] },
  ];
  st.tasks = [
    { id: 't1', title: 'Study AWS IAM policies', date: t, time: '19:30', priority: 'medium', note: '', subs: [] },
    { id: 't2', title: 'ISTQB mock test, chapter 3', date: shift(t, 2), time: '', priority: 'high', note: '', subs: [] },
    { id: 't3', title: 'Write sprint retro notes', date: shift(t, -1), time: '', priority: '', note: '', subs: [] },
  ];
  let s = 17;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 70; i >= 1; i--) {
    const d = shift(t, -i);
    const ids = tasksFor(st, d).map((x) => x.id);
    if (!ids.length) continue;
    const r = rnd();
    let dn = i <= 6 ? ids : r < 0.6 ? ids : r < 0.88 ? ids.filter(() => rnd() < 0.55) : [];
    if (i === 1) dn = ids.filter((x) => x !== 't3');
    if (dn.length) st.done[d] = dn;
    if (rnd() < 0.55) st.focus[d] = { m: 25 * (1 + Math.floor(rnd() * 3)), by: {} };
  }
  st.rest[shift(t, -20)] = true;
  st.done[t] = ['r1'];
  st.subDone[t] = { r3: ['s1'] };
  st.focus[t] = { m: 25, by: { r1: 25 } };
  // `info` caches per object; build a fresh copy to check yesterday after all edits.
  const check = { ...st };
  if (!info(check, shift(t, -1)).complete) st.tasks = st.tasks.filter((x) => x.id !== 't3');
  const now = Date.now();
  st.todos = [
    { id: uid(), title: 'Run the full regression suite', details: 'Cover every module before the release cut.', deadline: shift(t, -2), priority: 'high', done: false, created: now },
    { id: uid(), title: 'Send test report to the team', details: '', deadline: t, priority: 'medium', done: false, created: now - 1 },
    { id: uid(), title: 'Update resume with new project', details: '', deadline: shift(t, 5), priority: 'low', done: false, created: now - 2 },
    { id: uid(), title: 'Book dentist appointment', details: '', deadline: '', priority: 'low', done: false, created: now - 3 },
    { id: uid(), title: 'Renew library books', details: '', deadline: shift(t, -4), priority: 'low', done: true, doneAt: now - 864e5, created: now - 4 },
  ];
  st.notes = [
    { id: uid(), cat: 'goals', color: 'purple', title: 'Learning ladder', body: '1. Know\n2. Understand\n3. Apply\n4. Think\n5. Investigate\n6. Improve\n7. Create or teach', pinned: true, updated: now - 864e5 * 3 },
    { id: uid(), cat: 'habits', color: 'yellow', title: 'Keep the chain alive', body: 'On busy days, do the smallest version: one problem, five pages, a ten-minute walk.', pinned: false, updated: now - 864e5 },
    { id: uid(), cat: 'work', color: 'green', title: 'Sprint focus', body: 'Automate login flow tests.\nPair on the flaky checkout test.\nDemo on Friday.', pinned: false, updated: now - 864e5 * 2 },
    { id: uid(), cat: 'ideas', color: 'blue', title: 'Side project', body: 'A small CLI that turns test logs into a weekly summary.', pinned: false, updated: now - 864e5 * 6 },
  ];
  return st;
}
