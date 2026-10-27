import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { Calendar, Check, Clock, FileText, ListChecks, Pencil, Play, Plus, Repeat, Timer, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DayTask, Todo } from '../lib/types';
import { fmtMins, relDay, t12, today } from '../lib/dates';
import { PRI, isDone, repeatLabel, subIsDone } from '../lib/domain';
import { parseQuick, type Quick } from '../lib/parse';
import { addQuick, tick, undoToast } from '../lib/actions';
import { useApp } from '../store/app';
import { useUI } from '../store/ui';
import { useFocus } from '../store/focus';
import { PriTag } from './ui';
import { cn } from '../lib/cn';

export function TaskMeta({ t, d, showTime = true }: { t: DayTask; d: string; showTime?: boolean }) {
  const data = useApp((s) => s.data);
  const subsDone = t.subs.filter((s) => subIsDone(data, d, t.id, s.id)).length;
  const fm = data.focus[d]?.by?.[t.id];
  const has = (showTime && t.time) || t.routine || t.priority || t.subs.length || t.note || fm;
  if (!has) return null;
  return (
    <div className="t-meta">
      {showTime && t.time && <span className="tag muted num"><Clock />{t12(t.time)}</span>}
      {t.routine && <span className="tag accent"><Repeat />{repeatLabel(t.days)}</span>}
      <PriTag p={t.priority} />
      {t.subs.length > 0 && <span className={cn('tag num', subsDone === t.subs.length ? 'good' : 'muted')}><ListChecks />{subsDone}/{t.subs.length}</span>}
      {t.note && <span className="tag muted" title="Has a note"><FileText /></span>}
      {fm ? <span className="tag teal num"><Timer />{fmtMins(fm)}</span> : null}
    </div>
  );
}

export function TaskRow({ t, d, showTime = true }: { t: DayTask; d: string; showTime?: boolean }) {
  const done = useApp((s) => isDone(s.data, d, t.id));
  const just = useUI((s) => s.just === t.id);
  const open = useUI((s) => s.open);
  const startFocus = useFocus((s) => s.start);
  const canTick = d <= today();
  return (
    <motion.li layout="position" transition={{ type: 'spring', stiffness: 500, damping: 40 }}
      className={cn('task', done && 'done', just && 'pop')} onClick={() => open({ type: 'editor', id: t.id, date: d })}>
      {t.priority && <span className={`pri ${t.priority}`} />}
      <button className="check" aria-pressed={done} aria-label={`Mark ${t.title} ${done ? 'not done' : 'done'}`} disabled={!canTick}
        title={canTick ? undefined : 'You can tick this on the day'} onClick={(e) => { e.stopPropagation(); tick(d, t.id); }}>
        <Check size={14} strokeWidth={3} />
      </button>
      <div className="t-main"><span className="t-title">{t.title}</span><TaskMeta t={t} d={d} showTime={showTime} /></div>
      <div className="t-acts">
        {d === today() && !done && (
          <button className="icon-btn sm" aria-label={`Start focus on ${t.title}`} title="Start focus"
            onClick={(e) => { e.stopPropagation(); startFocus(t.id, t.title); toast(`Focus started on “${t.title}”`); }}><Play size={14} /></button>
        )}
        <button className="icon-btn sm hide-m" aria-label="Edit" title="Edit" onClick={(e) => { e.stopPropagation(); open({ type: 'editor', id: t.id, date: d }); }}><Pencil size={14} /></button>
      </div>
    </motion.li>
  );
}

export function TodoRow({ t }: { t: Todo }) {
  const update = useApp((s) => s.update);
  const open = useUI((s) => s.open);
  const just = useUI((s) => s.just === t.id);
  const tdy = today();
  const od = !t.done && !!t.deadline && t.deadline < tdy;
  return (
    <motion.li layout="position" className={cn('todo', t.done && 'done', just && 'pop')}>
      <button className={cn('check', t.done && 'on')} aria-pressed={t.done} aria-label={`Mark ${t.title} ${t.done ? 'pending' : 'done'}`}
        onClick={() => {
          update((x) => { const k = x.todos.find((y) => y.id === t.id)!; k.done = !k.done; k.doneAt = Date.now(); });
          useUI.getState().setJust(t.id); setTimeout(() => useUI.getState().setJust(null), 700);
          if (!t.done) toast('Done. +5 XP');
        }}><Check size={14} strokeWidth={3} /></button>
      <div className="body" role="button" tabIndex={0} onClick={() => open({ type: 'todo', id: t.id })} onKeyDown={(e) => { if (e.key === 'Enter') open({ type: 'todo', id: t.id }); }}>
        <b>{t.title}</b>{t.details && <p>{t.details}</p>}
        <div className="t-meta" style={{ marginTop: t.details ? 0 : 6 }}>
          <span className={`tag ${PRI[t.priority]?.c || 'muted'}`}>{PRI[t.priority]?.l || 'Normal'}</span>
          {t.deadline && <span className={cn('tag num', od ? 'bad' : t.deadline === tdy ? 'accent' : 'muted')}><Calendar />{relDay(t.deadline)}{od ? ' · overdue' : ''}</span>}
        </div>
      </div>
      <button className="icon-btn sm del" aria-label={`Delete ${t.title}`} onClick={() => { const prev = update((x) => { x.todos = x.todos.filter((y) => y.id !== t.id); }); undoToast('Todo deleted', prev); }}><Trash2 size={15} /></button>
    </motion.li>
  );
}

export function QuickPreview({ p }: { p: Quick | null }) {
  if (!p || !p.title) return <span className="hint">Type naturally: <b>10am</b>, <b>tomorrow</b>, <b>on fri</b>, <b>daily</b>, <b>weekdays</b>, <b>every mon wed</b>, <b>!high</b></span>;
  return (
    <>
      <span className="tag muted">{p.days ? <Repeat /> : <Calendar />}{p.days ? repeatLabel(p.days) : relDay(p.date)}</span>
      {p.time && <span className="tag muted num"><Clock />{t12(p.time)}</span>}
      <PriTag p={p.priority} />
      <span className="hint">Press Enter to add “{p.title}”</span>
    </>
  );
}

/** Natural-language task input with a live preview of what will be created. */
export function Composer({ base, onAdded, autoFocus }: { base: string; onAdded?: () => void; autoFocus?: boolean }) {
  const [v, setV] = useState('');
  const p = v.trim() ? parseQuick(v, base) : null;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!p || !p.title) return;
    addQuick(p); setV(''); onAdded?.();
  };
  return (
    <form className="composer" onSubmit={submit} autoComplete="off">
      <div className="box">
        <Plus size={18} />
        <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Add a task… try “Standup 10am weekdays”" aria-label="Add a task" maxLength={160} data-autofocus={autoFocus || undefined} data-composer />
        <button className="btn accent sm" aria-label="Add task">Add</button>
      </div>
      <div className="preview"><QuickPreview p={p} /></div>
    </form>
  );
}
