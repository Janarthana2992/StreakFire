import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Columns3, LayoutGrid, Moon, Plus } from 'lucide-react';
import { useApp } from '../store/app';
import { useClock, useUI } from '../store/ui';
import { DOW, eachDay, fmt, parse, shift, t12, weekStart, ymd } from '../lib/dates';
import { info, isDone, tasksFor, todosDue } from '../lib/domain';
import { tick } from '../lib/actions';
import { Seg } from '../components/ui';
import { cn } from '../lib/cn';

export default function Plan() {
  const data = useApp((s) => s.data);
  const update = useApp((s) => s.update);
  const today = useClock((s) => s.day);
  const open = useUI((s) => s.open);
  const [view, setView] = useState<'month' | 'week'>(() => (innerWidth < 620 ? 'month' : 'month'));
  const [cal, setCal] = useState(today.slice(0, 8) + '01');
  const [wk, setWk] = useState(weekStart(today));

  const head = (title: string, prev: () => void, next: () => void) => (
    <div className="cal-head">
      <button className="icon-btn" onClick={prev} aria-label="Previous"><ChevronLeft size={18} /></button>
      <h2>{title}</h2>
      <button className="icon-btn" onClick={next} aria-label="Next"><ChevronRight size={18} /></button>
      <span className="sp" />
      <button className="btn sm" onClick={() => { setCal(today.slice(0, 8) + '01'); setWk(weekStart(today)); }}>Today</button>
    </div>
  );

  let body;
  if (view === 'month') {
    const m = parse(cal), y = m.getFullYear(), mo = m.getMonth();
    const start = weekStart(cal), last = ymd(new Date(y, mo + 1, 0)), end = shift(weekStart(last), 6);
    const cells: string[] = []; eachDay(start, end, (d) => cells.push(d));
    let hit = 0, elapsed = 0;
    cells.forEach((dd) => { const i = info(data, dd); if (dd.slice(0, 7) === cal.slice(0, 7) && dd <= today && i.counts) { elapsed++; if (i.complete) hit++; } });
    body = (
      <div className="card cal">
        {head(m.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), () => setCal(ymd(new Date(y, mo - 1, 1))), () => setCal(ymd(new Date(y, mo + 1, 1))))}
        <div className="grid7">
          {DOW.map((x) => <div key={x} className="dow">{x}</div>)}
          {cells.map((dd) => {
            const i = info(data, dd), fut = dd > today, other = dd.slice(0, 7) !== cal.slice(0, 7);
            const dueN = todosDue(data, dd).filter((t) => !t.done).length;
            const cls = fut ? 'future' : i.rest ? 'rest' : !i.total ? '' : i.complete ? 'complete' : i.done ? 'partial' : dd < today ? 'missed' : '';
            return (
              <button key={dd} className={cn('day', cls, dd === today && 'today', other && 'other')} onClick={() => open({ type: 'day', date: dd })}
                aria-label={`${fmt(dd, { weekday: 'long', month: 'long', day: 'numeric' })}${i.rest ? ', rest day' : `, ${i.done} of ${i.total} done`}${dueN ? `, ${dueN} todos due` : ''}`}>
                <span className="dtop"><span className="dn num">{parse(dd).getDate()}</span><span className="marks">{i.rest && <Moon />}{dueN > 0 && <span className="dot" />}</span></span>
                {i.total > 0 && !i.rest && <span className="meta num">{i.done}/{i.total}<span className="bar"><i style={{ width: `${i.pct * 100}%` }} /></span></span>}
              </button>
            );
          })}
        </div>
        <div className="legend">
          <span><i style={{ background: 'var(--good)' }} />Goal hit</span><span><i style={{ background: 'var(--warn)' }} />Partial</span>
          <span><i style={{ background: 'var(--bad)' }} />Missed</span><span><i style={{ background: 'var(--sky)' }} />Rest day</span>
          <span><i style={{ background: 'var(--teal)', borderRadius: '50%' }} />Todo due</span>
          <span className="num" style={{ marginLeft: 'auto', color: 'var(--good)', fontWeight: 800 }}>{hit}/{elapsed} days hit this month</span>
        </div>
      </div>
    );
  } else {
    const e = shift(wk, 6);
    const title = `${fmt(wk, { month: 'short', day: 'numeric' })} – ${fmt(e, { month: wk.slice(5, 7) === e.slice(5, 7) ? undefined : 'short', day: 'numeric', year: 'numeric' })}`;
    body = (
      <div className="card cal">
        {head(title, () => setWk(shift(wk, -7)), () => setWk(shift(wk, 7)))}
        <div className="weekgrid">
          {DOW.map((n, i) => {
            const dd = shift(wk, i), ii = info(data, dd), ts = tasksFor(data, dd), tds = todosDue(data, dd);
            return (
              <div key={dd} className={cn('wcol', dd === today && 'today', ii.rest && 'rest')}>
                <div className="wcol-head"><div><small>{n}</small><b className="num">{parse(dd).getDate()}</b></div><span className="sp" />
                  {ii.rest ? <span className="tag sky"><Moon />Rest</span> : ii.total ? <span className={cn('tag num', ii.complete ? 'good' : ii.done ? 'warn' : 'muted')}>{ii.done}/{ii.total}</span> : null}</div>
                {ts.map((t) => {
                  const dn = isDone(data, dd, t.id);
                  return (
                    <div key={t.id} className={cn('witem', dn && 'done')} onClick={() => open({ type: 'editor', id: t.id, date: dd })}>
                      <button className={cn('check', dn && 'on')} aria-label={`Toggle ${t.title}`} disabled={dd > today} onClick={(ev) => { ev.stopPropagation(); tick(dd, t.id); }}><Check size={10} strokeWidth={3} /></button>
                      <span className="wt">{t.time && <small className="num">{t12(t.time)}</small>}{t.title}</span>
                    </div>
                  );
                })}
                {tds.map((t) => (
                  <div key={t.id} className={cn('witem todo', t.done && 'done')} onClick={() => open({ type: 'todo', id: t.id })}>
                    <button className={cn('check', t.done && 'on')} aria-label={`Toggle ${t.title}`} onClick={(ev) => { ev.stopPropagation(); update((x) => { const k = x.todos.find((y) => y.id === t.id)!; k.done = !k.done; k.doneAt = Date.now(); }); }}><Check size={10} strokeWidth={3} /></button>
                    <span className="wt"><small>Todo due</small>{t.title}</span>
                  </div>
                ))}
                <button className="wadd" onClick={() => open({ type: 'day', date: dd })}><Plus size={14} />Add</button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div><h1>Plan</h1><p>See your days at a glance. Tap a day to tick tasks, add more, or mark a rest day.</p></div>
        <Seg inline value={view} onChange={setView} options={[{ v: 'month', label: <><LayoutGrid size={15} />Month</> }, { v: 'week', label: <><Columns3 size={15} />Week</> }]} />
      </div>
      {body}
    </>
  );
}
