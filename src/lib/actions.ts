/** User actions shared by several screens. Each one updates the store and gives feedback. */
import { toast } from 'sonner';
import { useApp } from '../store/app';
import { useUI } from '../store/ui';
import type { Data } from './types';
import type { Quick } from './parse';
import { fmtMins, fmt, relDay, shift, today } from './dates';
import { bestStreak, info, isDone, repeatLabel, streak, toggleDone } from './domain';
import { uid } from './seed';
import { confetti } from './confetti';

const D = () => useApp.getState().data;
const update = (fn: (d: Data) => void) => useApp.getState().update(fn);

export function undoToast(msg: string, prev: Data) {
  toast(msg, { action: { label: 'Undo', onClick: () => useApp.getState().setData(prev) }, duration: 6000 });
}

export function tick(d: string, id: string) {
  const before = info(D(), d).complete;
  update((x) => toggleDone(x, d, id));
  useUI.getState().setJust(id);
  setTimeout(() => useUI.getState().setJust(null), 700);
  if (!before && info(D(), d).complete && d === today()) { confetti(); toast(`Goal hit! ${streak(D())}-day streak 🔥`); }
}

export function addQuick(p: Quick) {
  if (!p.title) return null;
  let added: { title: string } | null = null;
  update((x) => {
    if (p.days) {
      const r = { id: 'r' + uid(), title: p.title, from: p.dateSet ? p.date : p.date < today() ? p.date : today(), to: null, time: p.time, days: p.days, priority: p.priority, note: '', subs: [] };
      x.routines.push(r); added = r;
    } else {
      const t = { id: 't' + uid(), title: p.title, date: p.date, time: p.time, priority: p.priority, note: '', subs: [] };
      x.tasks.push(t); added = t;
    }
  });
  toast(`Added “${p.title}”${p.days ? ` · ${repeatLabel(p.days)}` : p.date !== today() ? ` · ${relDay(p.date)}` : ''}`);
  return added;
}

export function toggleRest(d: string) {
  const prev = update((x) => { if (x.rest[d]) delete x.rest[d]; else x.rest[d] = true; });
  undoToast(D().rest[d] ? `${relDay(d)} is a rest day. Your streak is paused, not broken.` : 'Rest day removed', prev);
}

export function carryOver() {
  const t = today(), yd = shift(t, -1);
  let n = 0;
  const prev = update((x) => { x.tasks.forEach((k) => { if (k.date === yd && !isDone(x, yd, k.id)) { k.date = t; n++; } }); x.carry[t] = true; });
  undoToast(`Moved ${n} task${n === 1 ? '' : 's'} to today`, prev);
}

export async function shareProgress() {
  const x = D(), t = today(), i = info(x, t);
  const txt = `🔥 StreakFire · ${fmt(t, { month: 'short', day: 'numeric' })}: ${i.done}/${i.total} tasks done · ${streak(x)}-day streak (best ${bestStreak(x)}) · ${fmtMins(x.focus[t]?.m || 0)} focus`;
  try { await navigator.clipboard.writeText(txt); toast('Progress copied. Paste it anywhere.'); }
  catch { toast('Copy this:', { description: txt, duration: 10000 }); }
}

export function newTodo(title: string) {
  update((x) => { x.todos.push({ id: uid(), title, details: '', deadline: '', priority: 'medium', done: false, created: Date.now() }); });
  toast('Todo added');
}
