import { useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router';
import { CalendarDays, ChartColumn, Keyboard, ListTodo, Moon, Plus, Repeat, Search, SlidersHorizontal, StickyNote, Sun, Sunset, Timer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApp } from '../store/app';
import { useUI } from '../store/ui';
import { useFocus } from '../store/focus';
import { useResolvedTheme } from '../store/theme';
import { relDay, t12, today } from '../lib/dates';
import { CATS, info, repeatLabel } from '../lib/domain';
import { parseQuick } from '../lib/parse';
import { addQuick, newTodo, toggleRest } from '../lib/actions';
import { PALETTES } from '../lib/palettes';
import { Palette } from 'lucide-react';

function Item({ icon: Icon, title, sub, k, onSelect, value }: { icon: LucideIcon; title: string; sub?: string; k?: string; onSelect: () => void; value: string }) {
  return (
    <Command.Item value={value} onSelect={onSelect} className="pal-item">
      <span className="pi"><Icon size={15} /></span><b>{title}</b>{sub && <small>{sub}</small>}{k && <kbd>{k}</kbd>}
    </Command.Item>
  );
}

/** Ctrl/⌘ K: search everything, jump anywhere, run any command, or create a task from the text. */
export function CommandPalette() {
  const openState = useUI((s) => s.palette);
  const setPalette = useUI((s) => s.setPalette);
  const openDialog = useUI((s) => s.open);
  const data = useApp((s) => s.data);
  const update = useApp((s) => s.update);
  const startFocus = useFocus((s) => s.start);
  const theme = useResolvedTheme((s) => s.t);
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const run = (fn: () => void) => { setPalette(false); setQ(''); fn(); };
  const ql = q.trim().toLowerCase();
  const has = (s: string) => s.toLowerCase().includes(ql);
  const p = q.trim() ? parseQuick(q) : null;
  const actions = ([
    [Plus, 'Add a task', 'N', () => openDialog({ type: 'quick' })],
    [ListTodo, 'New todo', 'T', () => openDialog({ type: 'todo' })],
    [StickyNote, 'New note', 'J', () => openDialog({ type: 'note' })],
    [Timer, 'Start a focus session', 'F', () => startFocus('', 'Focus session')],
    [Sunset, 'Wrap up the day', 'W', () => openDialog({ type: 'review' })],
    [Moon, info(data, today()).rest ? 'End rest day' : 'Make today a rest day', '', () => toggleRest(today())],
    [theme === 'dark' ? Sun : Moon, theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme', '', () => update((x) => { x.theme = theme === 'dark' ? 'light' : 'dark'; })],
    ...PALETTES.filter((t) => t.id !== data.palette).map((t) => [Palette, `Colour theme: ${t.name}`, '', () => update((x) => { x.palette = t.id; })] as [LucideIcon, string, string, () => void]),
    [SlidersHorizontal, 'Settings', '', () => openDialog({ type: 'settings' })],
    [Keyboard, 'Keyboard shortcuts', '?', () => openDialog({ type: 'shortcuts' })],
  ] as [LucideIcon, string, string, () => void][]).filter(([, l]) => !ql || has(l));
  const pages = ([[Sun, 'Today', '/today'], [CalendarDays, 'Plan', '/plan'], [ListTodo, 'Todos', '/todos'], [StickyNote, 'Notes', '/notes'], [ChartColumn, 'Insights', '/insights']] as [LucideIcon, string, string][])
    .filter(([, l]) => !ql || has(l));

  return (
    <Command.Dialog open={openState} onOpenChange={(o) => { setPalette(o); if (!o) setQ(''); }} label="Search and commands" shouldFilter={false}
      overlayClassName="modal-overlay" contentClassName="palette-content">
      <div className="pal">
        <div className="pal-in"><Search size={20} /><Command.Input value={q} onValueChange={setQ} placeholder="Search tasks, todos, notes… or type a new task" /><kbd>Esc</kbd></div>
        <Command.List>
          <Command.Empty>No matches</Command.Empty>
          {p?.title && (
            <Command.Group heading="Create">
              <Item value="create-task" icon={Plus} title={`Add task: ${p.title}`} sub={p.days ? repeatLabel(p.days) : relDay(p.date) + (p.time ? ` · ${t12(p.time)}` : '')} onSelect={() => run(() => addQuick(p))} />
              <Item value="create-todo" icon={ListTodo} title={`New todo: ${q.trim()}`} sub="Todos" onSelect={() => run(() => newTodo(q.trim()))} />
            </Command.Group>
          )}
          {ql && (
            <>
              {data.routines.filter((r) => !r.to && has(r.title)).slice(0, 5).length > 0 && (
                <Command.Group heading="Routines">
                  {data.routines.filter((r) => !r.to && has(r.title)).slice(0, 5).map((r) => <Item key={r.id} value={'r' + r.id} icon={Repeat} title={r.title} sub={repeatLabel(r.days) + (r.time ? ` · ${t12(r.time)}` : '')} onSelect={() => run(() => openDialog({ type: 'editor', id: r.id, date: today() }))} />)}
                </Command.Group>
              )}
              {data.tasks.filter((t) => has(t.title)).length > 0 && (
                <Command.Group heading="Tasks">
                  {data.tasks.filter((t) => has(t.title)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map((t) => <Item key={t.id} value={'t' + t.id} icon={CalendarDays} title={t.title} sub={relDay(t.date)} onSelect={() => run(() => openDialog({ type: 'editor', id: t.id, date: t.date }))} />)}
                </Command.Group>
              )}
              {data.todos.filter((t) => has(`${t.title} ${t.details}`)).length > 0 && (
                <Command.Group heading="Todos">
                  {data.todos.filter((t) => has(`${t.title} ${t.details}`)).slice(0, 5).map((t) => <Item key={t.id} value={'d' + t.id} icon={ListTodo} title={t.title} sub={t.done ? 'Done' : t.deadline ? relDay(t.deadline) : 'Someday'} onSelect={() => run(() => openDialog({ type: 'todo', id: t.id }))} />)}
                </Command.Group>
              )}
              {data.notes.filter((n) => has(`${n.title} ${n.body}`)).length > 0 && (
                <Command.Group heading="Notes">
                  {data.notes.filter((n) => has(`${n.title} ${n.body}`)).slice(0, 5).map((n) => <Item key={n.id} value={'n' + n.id} icon={StickyNote} title={n.title || 'Untitled'} sub={CATS[n.cat]} onSelect={() => run(() => openDialog({ type: 'note', id: n.id }))} />)}
                </Command.Group>
              )}
            </>
          )}
          {actions.length > 0 && (
            <Command.Group heading="Actions">
              {actions.map(([I, l, k, fn]) => <Item key={l} value={'a' + l} icon={I} title={l} k={k || undefined} onSelect={() => run(fn)} />)}
            </Command.Group>
          )}
          {pages.length > 0 && (
            <Command.Group heading="Go to">
              {pages.map(([I, l, to]) => <Item key={to} value={'g' + l} icon={I} title={l} onSelect={() => run(() => nav(to))} />)}
            </Command.Group>
          )}
        </Command.List>
        <div className="pal-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div>
      </div>
    </Command.Dialog>
  );
}
