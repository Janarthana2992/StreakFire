import { Fragment } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight, CheckCheck, Flame, Inbox, Moon, RefreshCw, Share2, Sparkles, Sunset, Timer, Trophy } from 'lucide-react';
import { useApp } from '../store/app';
import { useClock, useUI } from '../store/ui';
import { useFocus } from '../store/focus';
import { DOW, fmt, fmtMins, mins, pad, parse, shift, t12, weekStart } from '../lib/dates';
import { QUOTES, bestStreak, info, isDone, streak, tasksFor } from '../lib/domain';
import { parseQuick } from '../lib/parse';
import { addQuick, carryOver, shareProgress, toggleRest, undoToast } from '../lib/actions';
import { blank } from '../lib/seed';
import { Composer, TaskRow, TodoRow } from '../components/TaskRow';
import { Empty, MiniRing, Ring } from '../components/ui';
import { cn } from '../lib/cn';

const SUGGEST = ['Team standup 10am weekdays', 'Read 20 pages daily', 'Check email 9am weekdays', 'Plan tomorrow 6pm daily', 'Workout 7am every mon wed fri'];

export default function Today() {
  const data = useApp((s) => s.data);
  const update = useApp((s) => s.update);
  const { day: d, min: now } = useClock();
  const open = useUI((s) => s.open);
  const startFocus = useFocus((s) => s.start);

  const ts = tasksFor(data, d), inf = info(data, d), sk = streak(data);
  const hr = Math.floor(now / 60);
  const greet = hr < 5 ? 'Burning the midnight oil' : hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const first = (data.name || 'You').trim().split(/\s+/)[0];
  const yd = shift(d, -1);
  const left = data.tasks.filter((t) => t.date === yd && !isDone(data, yd, t.id));
  const timed = ts.filter((t) => t.time), anytime = ts.filter((t) => !t.time);
  const due = data.todos.filter((t) => !t.done && t.deadline && t.deadline <= d).sort((a, b) => a.deadline.localeCompare(b.deadline));
  const fm = data.focus[d]?.m || 0;
  const open_ = ts.filter((t) => !isDone(data, d, t.id));
  const next = open_.find((t) => t.time && mins(t.time) >= now) || open_.find((t) => t.time) || open_[0];
  const nowIdx = timed.findIndex((t) => mins(t.time) > now);
  const nowLabel = t12(`${pad(Math.floor(now / 60))}:${pad(now % 60)}`);
  const wk = weekStart(d);

  return (
    <>
      {data.sample && (
        <div className="banner"><Sparkles size={20} /><span><b>You're exploring example data.</b> Every screen has something to show. Clear it when you're ready to start your own streak.</span>
          <button className="btn sm primary" onClick={() => { const prev = data; useApp.getState().setData({ ...blank(data.name), theme: data.theme, palette: data.palette }); undoToast('Example data cleared. Your streak starts now.', prev); }}>Start fresh</button>
          <button className="btn sm ghost" onClick={() => update((x) => { x.sample = false; })}>Keep it</button></div>
      )}
      {left.length > 0 && !data.carry[d] && (
        <div className="banner accent"><ArrowRight size={20} /><span><b>{left.length} task{left.length > 1 ? 's' : ''} from yesterday {left.length > 1 ? "aren't" : "isn't"} done:</b> {left.slice(0, 3).map((t) => t.title).join(', ')}{left.length > 3 ? '…' : ''}</span>
          <button className="btn sm accent" onClick={carryOver}>Move to today</button>
          <button className="btn sm ghost" onClick={() => update((x) => { x.carry[d] = true; })}>Dismiss</button></div>
      )}

      <section className="hero">
        <div>
          <h1>{greet}, <em>{first}</em></h1>
          <div className="date">{fmt(d, { weekday: 'long', month: 'long', day: 'numeric' })}{inf.rest ? ' · Rest day' : ''}</div>
          <div className="quote"><Sparkles size={16} /><span>{QUOTES[data.quote % QUOTES.length]}</span>
            <button className="icon-btn sm" aria-label="Show another quote" title="Another quote" onClick={() => update((x) => { x.quote++; })}><RefreshCw size={14} /></button></div>
          <div className="hero-stats">
            <div className="hstat accent"><div className="i"><Flame size={17} /></div><div><b className="num">{sk}</b><small>day streak</small></div></div>
            <div className="hstat teal"><div className="i"><Trophy size={17} /></div><div><b className="num">{bestStreak(data)}</b><small>best streak</small></div></div>
            <div className="hstat good"><div className="i"><Timer size={17} /></div><div><b className="num">{fmtMins(fm)}</b><small>focus today</small></div></div>
          </div>
        </div>
        <div className="ringcol">
          <div className="ring-wrap" role="img" aria-label={`${inf.done} of ${inf.total} tasks done`}>
            <Ring pct={inf.pct} full={inf.complete} />
            <div className="ring-center"><div>
              <span className={cn('fl', sk > 0 && 'lit')}><Flame size={22} /></span>
              <motion.b key={Math.round(inf.pct * 100)} className="num" initial={{ scale: 0.85, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }}>{Math.round(inf.pct * 100)}%</motion.b>
              <small className="num">{inf.done} of {inf.total} done</small>
            </div></div>
          </div>
          <div className="ring-side">
            <span className="eyebrow">{inf.complete ? 'Goal hit' : next ? 'Up next' : 'No tasks yet'}</span>
            {next ? <><b>{next.title}</b><span className="num">{next.time ? t12(next.time) : 'Anytime'} · {open_.length} left</span></>
              : inf.total ? <><b>All done for today</b><span>Your streak is safe.</span></> : <><b>Plan your day</b><span>Add a task below.</span></>}
          </div>
        </div>
      </section>

      <div className="week" role="list" aria-label="This week">
        {DOW.map((n, i) => {
          const dd = shift(wk, i), ii = info(data, dd);
          return (
            <button key={dd} role="listitem" className={cn('wday', dd === d && 'today')} onClick={() => open({ type: 'day', date: dd })}
              aria-label={`${fmt(dd, { weekday: 'long' })}: ${ii.rest ? 'rest day' : `${ii.done} of ${ii.total} done`}`}>
              <small>{n}</small>
              <span className="mini"><MiniRing i={ii} /><span className="num">{ii.rest ? <Moon size={13} className="moon" /> : parse(dd).getDate()}</span></span>
            </button>
          );
        })}
      </div>

      {inf.rest && (
        <div className="rest-card"><Moon size={28} /><div><b>Rest day</b><span>Today won't break or add to your streak. Recharge.</span></div>
          <button className="btn sm" onClick={() => toggleRest(d)}>Back to work</button></div>
      )}

      <div className="cols">
        <section className="sec">
          <div className="sec-head">
            <h2>Today's plan</h2><span className={cn('tag num', inf.complete ? 'good' : 'accent')}>{inf.done}/{inf.total}</span><span className="sp" />
            <button className="btn sm ghost" onClick={() => open({ type: 'review' })} title="Wrap up the day"><Sunset size={15} /><span>Wrap up</span></button>
            <button className="icon-btn" onClick={() => toggleRest(d)} aria-label={inf.rest ? 'End rest day' : 'Make today a rest day'} title={inf.rest ? 'End rest day' : 'Rest day'}><Moon size={16} /></button>
            <button className="icon-btn" onClick={() => void shareProgress()} aria-label="Share progress" title="Share progress"><Share2 size={16} /></button>
          </div>
          <Composer base={d} />
          {ts.length ? (
            <>
              {timed.length > 0 && (
                <div className="timeline">
                  {timed.map((t, i) => (
                    <Fragment key={t.id}>
                      {i === nowIdx && <div className="now"><span className="num">{nowLabel.replace(' ', ' ')}</span><i /></div>}
                      <div className="tl-row"><span className={cn('tl-time num', mins(t.time) < now && 'past')}>{t12(t.time).replace(' ', ' ')}</span>
                        <ul className="list"><TaskRow t={t} d={d} showTime={false} /></ul></div>
                    </Fragment>
                  ))}
                  {nowIdx === -1 && <div className="now"><span>Now</span><i /></div>}
                </div>
              )}
              {anytime.length > 0 && (
                <>
                  {timed.length > 0 && <div className="group-h"><Inbox size={14} /> Anytime</div>}
                  <ul className="list">{anytime.map((t) => <TaskRow key={t.id} t={t} d={d} />)}</ul>
                </>
              )}
            </>
          ) : (
            <Empty icon={Sparkles} title="Plan your day">
              <span>Add your first routine or task. Tap a suggestion to start.</span>
              <div className="suggest">{SUGGEST.map((s) => <button key={s} onClick={() => { addQuick(parseQuick(s)); update((x) => { x.sample = false; }); }}>{s}</button>)}</div>
            </Empty>
          )}
        </section>

        <aside className="sec">
          <div className="sec-head"><h2>Due &amp; overdue</h2><span className="sp" /><Link className="btn sm ghost" to="/todos">All todos <ArrowRight size={14} /></Link></div>
          {due.length ? <ul className="list">{due.slice(0, 6).map((t) => <TodoRow key={t.id} t={t} />)}</ul>
            : <Empty icon={CheckCheck} compact><span>Nothing due today. Nice.</span></Empty>}
          {due.length > 6 && <Link className="hint" to="/todos">+{due.length - 6} more</Link>}
          <div className="card flex flex-col gap-2.5 p-4">
            <div className="sec-head"><h2 style={{ fontSize: 16 }}><Timer size={17} /> Focus</h2><span className="sp" /><span className="tag teal num">{fmtMins(fm)} today</span></div>
            <p className="hint">Pick a task and work without switching. Each minute of focus earns 1 XP.</p>
            <div className="acts" style={{ justifyContent: 'flex-start' }}>
              {[15, 25, 50].map((n) => (
                <button key={n} className={cn('btn sm', n === (data.focusLen || 25) && 'primary')} onClick={() => { update((x) => { x.focusLen = n; }); startFocus('', 'Focus session', n); }}>{n} min</button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
