import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../store/app';
import { useClock, useUI } from '../store/ui';
import { useFocus } from '../store/focus';
import { mins, t12 } from '../lib/dates';
import { isDone, repeatLabel, tasksFor } from '../lib/domain';
import { notify } from '../lib/notify';

const PAGES = ['/today', '/plan', '/todos', '/notes', '/insights'];

/** Global keyboard shortcuts. */
export function useShortcuts() {
  const nav = useNavigate();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ui = useUI.getState();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); ui.setPalette(!ui.palette); return; }
      const t = e.target as HTMLElement;
      if (t.matches('input,textarea,select,[contenteditable]') || e.metaKey || e.ctrlKey || e.altKey || ui.dialog || ui.palette) return;
      const k = e.key.toLowerCase();
      if (k >= '1' && k <= '5') { nav(PAGES[+k - 1]); return; }
      const map: Record<string, () => void> = {
        n: () => { const c = document.querySelector<HTMLInputElement>('[data-composer]'); if (c) c.focus(); else ui.open({ type: 'quick' }); },
        t: () => ui.open({ type: 'todo' }),
        j: () => ui.open({ type: 'note' }),
        f: () => { if (!useFocus.getState().session) useFocus.getState().start('', 'Focus session'); },
        w: () => ui.open({ type: 'review' }),
        '?': () => ui.open({ type: 'shortcuts' }),
        '/': () => ui.setPalette(true),
      };
      const fn = map[e.key] || map[k];
      if (fn) { e.preventDefault(); fn(); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [nav]);
}

/** Reminders: each timed task at its time, untimed tasks together at the chosen time. Checked every 30 s. */
const NKEY = 'streakfire.notified';
export function useReminders() {
  const { day, min } = useClock();
  const data = useApp((s) => s.data);
  useEffect(() => {
    if (!data.remind || data.rest[day]) return;
    let seen: string[] = [];
    try { seen = JSON.parse(localStorage.getItem(NKEY) || '[]'); } catch { /* ignore */ }
    const fire = (key: string, title: string, body: string) => { if (seen.includes(key)) return; seen.push(key); void notify(title, body); };
    const open = tasksFor(data, day).filter((t) => !isDone(data, day, t.id));
    open.filter((t) => t.time).forEach((t) => { const due = mins(t.time); if (min >= due && min - due <= 90) fire(`${day}|${t.id}|${t.time}`, `⏰ ${t.title}`, `${t12(t.time)} · ${t.routine ? `${repeatLabel(t.days)} routine` : 'Scheduled task'}`); });
    const untimed = open.filter((t) => !t.time), at = data.remindAt || '09:00';
    if (untimed.length && min >= mins(at) && min - mins(at) <= 180) fire(`${day}|untimed|${at}`, untimed.length === 1 ? untimed[0].title : `${untimed.length} tasks waiting today`, untimed.slice(0, 3).map((t) => t.title).join(', '));
    try { localStorage.setItem(NKEY, JSON.stringify(seen.filter((x) => x.startsWith(day)))); } catch { /* ignore */ }
  }, [day, min, data]);
}
