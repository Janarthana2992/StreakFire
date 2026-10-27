import { useState, type FormEvent } from 'react';
import { Calendar, Check, Play, Repeat, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../store/app';
import { useUI, type EditorPreset } from '../../store/ui';
import { useFocus } from '../../store/focus';
import type { Data, Priority, Sub } from '../../lib/types';
import { DOW, relDay, today } from '../../lib/dates';
import { ALL, WEEKDAYS, isDone, subIsDone, toggleDone, toggleSub } from '../../lib/domain';
import { undoToast } from '../../lib/actions';
import { uid } from '../../lib/seed';
import { Sheet } from '../Sheet';
import { PriDot, Seg } from '../ui';
import { cn } from '../../lib/cn';

function find(D: Data, id?: string) {
  if (!id) return null;
  const r = D.routines.find((x) => x.id === id); if (r) return { kind: 'repeat' as const, r };
  const t = D.tasks.find((x) => x.id === id); return t ? { kind: 'once' as const, t } : null;
}

/** Create or edit a task. Switching between one-time and repeating converts it, keeping past history. */
export function TaskEditor({ id, date, preset }: { id?: string; date: string; preset?: EditorPreset }) {
  const data = useApp((s) => s.data);
  const update = useApp((s) => s.update);
  const close = useUI((s) => s.close);
  const startFocus = useFocus((s) => s.start);
  const found = find(data, id);
  const obj = found ? (found.kind === 'repeat' ? found.r : found.t) : null;
  const isNew = !obj;

  const [kind, setKind] = useState<'once' | 'repeat'>(found?.kind ?? preset?.kind ?? 'once');
  const [title, setTitle] = useState(obj?.title ?? preset?.title ?? '');
  const [day, setDay] = useState(found?.kind === 'once' ? found.t.date : date);
  const [days, setDays] = useState<number[]>(found?.kind === 'repeat' ? found.r.days : preset?.days ?? ALL.slice());
  const [time, setTime] = useState(obj?.time ?? preset?.time ?? '');
  const [priority, setPriority] = useState<Priority>(obj?.priority ?? preset?.priority ?? '');
  const [note, setNote] = useState(obj?.note ?? '');
  const [subs, setSubs] = useState<Sub[]>(obj?.subs ?? []);
  const [newSub, setNewSub] = useState('');

  const done = !isNew && isDone(data, date, id!);
  const canTick = !isNew && date <= today();
  const presetKey = days.length === 7 ? 'daily' : [...days].sort().join('') === '01234' ? 'weekdays' : 'custom';

  const addSub = () => { const v = newSub.trim(); if (!v) return; setSubs([...subs, { id: 's' + uid(), t: v }]); setNewSub(''); };
  const tickSub = (sid: string) => {
    update((x) => {
      toggleSub(x, date, id!, sid);
      const o = find(x, id)!; const all = (o.kind === 'repeat' ? o.r : o.t).subs;
      if (all.length && all.every((s) => subIsDone(x, date, id!, s.id)) && !isDone(x, date, id!)) { toggleDone(x, date, id!); toast('All steps done, task ticked off'); }
    });
  };

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (kind === 'repeat' && !days.length) { toast('Pick at least one day'); return; }
    const base = { title: title.trim(), time, priority, note: note.trim(), subs };
    update((x) => {
      const f = find(x, id);
      if (f && f.kind === kind) {
        if (f.kind === 'repeat') Object.assign(f.r, base, { days: [...days].sort() });
        else Object.assign(f.t, base, { date: day });
        return;
      }
      if (f) { // converting: keep history of the old one
        if (f.kind === 'repeat') { if (f.r.from >= today()) x.routines = x.routines.filter((r) => r !== f.r); else f.r.to = today(); }
        else x.tasks = x.tasks.filter((t) => t !== f.t);
      }
      if (kind === 'repeat') x.routines.push({ id: 'r' + uid(), from: f ? today() : date, to: null, days: [...days].sort(), ...base });
      else x.tasks.push({ id: 't' + uid(), date: day, ...base });
    });
    close();
    toast(isNew ? 'Task added' : 'Saved');
  };

  const remove = () => {
    const f = find(data, id); if (!f) return;
    const prev = update((x) => {
      const g = find(x, id)!;
      if (g.kind === 'repeat') { if (g.r.from >= date) x.routines = x.routines.filter((r) => r !== g.r); else g.r.to = date; }
      else x.tasks = x.tasks.filter((t) => t !== g.t);
    });
    close();
    undoToast(f.kind === 'repeat' ? `“${f.r.title}” stopped from ${relDay(date).toLowerCase()}. Past days are kept.` : 'Task deleted', prev);
  };

  return (
    <Sheet title={isNew ? 'New task' : 'Edit task'} sub={isNew ? undefined : `${found!.kind === 'repeat' ? 'Routine' : 'Task'} · ${relDay(date)}${done ? ' · done' : ''}`}>
      <form onSubmit={save} className="contents" autoComplete="off">
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What do you want to do?" required maxLength={160} aria-label="Title" data-autofocus style={{ fontSize: 17, fontWeight: 600, height: 50 }} />
        <div className="field"><span>When</span>
          <Seg value={kind} onChange={setKind} options={[{ v: 'once', label: <><Calendar size={15} />One time</> }, { v: 'repeat', label: <><Repeat size={15} />Repeats</> }]} /></div>
        {kind === 'once' ? (
          <div className="f2">
            <label className="field"><span>Date</span><input className="input" type="date" value={day} onChange={(e) => setDay(e.target.value)} required /></label>
            <label className="field"><span>Time (optional)</span><input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label>
          </div>
        ) : (
          <>
            <div className="field">
              <Seg value={presetKey} onChange={(p) => setDays(p === 'daily' ? ALL.slice() : p === 'weekdays' ? WEEKDAYS.slice() : presetKey === 'custom' ? days : [0, 2, 4])}
                options={[{ v: 'daily', label: 'Every day' }, { v: 'weekdays', label: 'Weekdays' }, { v: 'custom', label: 'Custom' }]} />
              <div className="days7" role="group" aria-label="Repeat on">
                {DOW.map((n, i) => (
                  <label key={n}><input type="checkbox" checked={days.includes(i)} onChange={(e) => setDays(e.target.checked ? [...new Set([...days, i])] : days.filter((x) => x !== i))} />{n.slice(0, 2)}</label>
                ))}
              </div>
            </div>
            <label className="field"><span>Time (optional)</span><input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label>
          </>
        )}
        <div className="field"><span>Priority</span>
          <Seg value={priority} onChange={setPriority} options={[{ v: '', label: 'None' }, ...(['low', 'medium', 'high'] as const).map((p) => ({ v: p, label: <><PriDot p={p} />{p[0].toUpperCase() + p.slice(1)}</> }))]} /></div>
        <div className="field">
          <span>Checklist {subs.length > 0 && <span className="num">· {isNew ? subs.length : `${subs.filter((s) => subIsDone(data, date, id!, s.id)).length}/${subs.length}`}</span>}</span>
          <div className="sub-list">
            {subs.map((s) => {
              const sd = !isNew && subIsDone(data, date, id!, s.id);
              return (
                <div key={s.id} className={cn('sub', sd && 'done')}>
                  {!isNew && <button type="button" className={cn('check', sd && 'on')} aria-label={`Toggle ${s.t}`} disabled={!canTick} onClick={() => tickSub(s.id)}><Check size={11} strokeWidth={3} /></button>}
                  <span>{s.t}</span>
                  <button type="button" className="icon-btn sm del" aria-label="Remove step" onClick={() => setSubs(subs.filter((x) => x.id !== s.id))}><X size={14} /></button>
                </div>
              );
            })}
            <div className="flex gap-2">
              <input className="input" value={newSub} onChange={(e) => setNewSub(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSub(); } }} placeholder="Add a step and press Enter" maxLength={120} style={{ height: 38 }} />
              <button type="button" className="btn sm" onClick={addSub}>Add</button>
            </div>
          </div>
        </div>
        <label className="field"><span>Note</span><textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Links, details, anything useful" style={{ minHeight: 76 }} /></label>
        <div className="acts">
          {!isNew && <button type="button" className="btn sm danger" onClick={remove}><Trash2 size={15} />{found!.kind === 'repeat' ? 'Stop routine' : 'Delete'}</button>}
          <span className="sp" />
          {!isNew && date === today() && !done && <button type="button" className="btn sm" onClick={() => { startFocus(id!, title); close(); toast(`Focus started on “${title}”`); }}><Play size={14} />Focus</button>}
          <button type="button" className="btn sm ghost" onClick={close}>Cancel</button>
          <button className="btn accent">{isNew ? 'Add task' : 'Save'}</button>
        </div>
      </form>
    </Sheet>
  );
}
