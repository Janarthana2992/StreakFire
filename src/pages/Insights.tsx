import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion } from 'motion/react';
import { ChartColumn, CheckCheck, Flame, Timer, TrendingUp, Trophy } from 'lucide-react';
import { useApp } from '../store/app';
import { useClock } from '../store/ui';
import { useTokens } from '../store/theme';
import type { Data } from '../lib/types';
import { DOW, DOWL, addDays, dow0, eachDay, fmt, fmtMins, parse, shift, weekStart, ymd } from '../lib/dates';
import { BADGES, LVL, badgeProgress, countComplete, firstDate, focusMins, info, level, levelName, levelPct, streak, xp } from '../lib/domain';
import { Medal, Seg, Stat } from '../components/ui';
import { cn } from '../lib/cn';

type Tone = 'good' | 'warn' | 'bad' | 'none' | 'accent' | 'teal';
interface Pt { label: string; tip: string; v: number; rest?: number; tone: Tone; none?: boolean }
const TOKENS = ['good', 'warn', 'bad', 'track', 'accent', 'teal', 'muted', 'line', 'fg'] as const;

function Chart({ data, kind, unit }: { data: Pt[]; kind: 'pct' | 'stack' | 'mins'; unit?: string }) {
  const c = useTokens(TOKENS);
  const color = (t: Tone) => (t === 'none' ? c.track : c[t]);
  const yfmt = (v: number) => (kind === 'pct' ? `${v}%` : kind === 'mins' ? (v >= 60 ? `${Math.round((v / 60) * 10) / 10}h` : `${v}m`) : String(v));
  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke={c.line} />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: c.line }} tick={{ fill: c.muted }} interval="preserveStartEnd" minTickGap={6} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: c.muted }} tickFormatter={yfmt} domain={kind === 'pct' ? [0, 100] : [0, 'auto']} allowDecimals={false} width={44} />
          <Tooltip cursor={{ fill: c.track, opacity: 0.5 }} content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as Pt;
            return <div className="chart-tip"><small>{p.tip}</small>{p.none ? 'No tasks' : kind === 'pct' ? `${Math.round(p.v)}% done` : kind === 'mins' ? `${fmtMins(p.v)} focus` : `${p.v} of ${p.v + (p.rest || 0)} done`}{unit ? ` ${unit}` : ''}</div>;
          }} />
          <Bar dataKey="v" stackId="a" radius={kind === 'stack' ? [0, 0, 4, 4] : [5, 5, 2, 2]} isAnimationActive animationDuration={600}>
            {data.map((p, i) => <Cell key={i} fill={color(p.tone)} />)}
          </Bar>
          {kind === 'stack' && <Bar dataKey="rest" stackId="a" fill={c.track} radius={[5, 5, 0, 0]} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Heatmap({ data, today }: { data: Data; today: string }) {
  const start = shift(weekStart(today), -7 * 25), end = shift(weekStart(today), 6);
  const cells: { d: string; c: string; t: string }[] = [];
  eachDay(start, end, (d) => {
    const i = info(data, d);
    let c = '';
    if (d > today) c = 'fut'; else if (i.rest) c = 'rest'; else if (i.counts) c = i.complete ? 'l4' : i.pct >= 0.5 ? 'l3' : i.pct > 0 ? 'l2' : '';
    cells.push({ d, c, t: `${fmt(d, { weekday: 'short', month: 'short', day: 'numeric' })}: ${i.rest ? 'rest day' : i.total ? `${i.done}/${i.total} done` : 'no tasks'}` });
  });
  return <div className="heat-wrap"><div className="heat">{cells.map((x) => <i key={x.d} className={cn(x.c, x.d === today && 'today')} title={x.t} />)}</div></div>;
}

function Progress() {
  const data = useApp((s) => s.data);
  const today = useClock((s) => s.day);
  const [range, setRange] = useState<'7' | '30' | '12'>('7');
  const t = parse(today);
  const items: Pt[] = [], stack: Pt[] = [], foc: Pt[] = [];
  const tone = (d: string): Tone => { const i = info(data, d); return i.rest || !i.total ? 'none' : i.complete ? 'good' : i.done ? 'warn' : 'bad'; };
  if (range === '12') {
    for (let k = 11; k >= 0; k--) {
      const ms = new Date(t.getFullYear(), t.getMonth() - k, 1), me = new Date(t.getFullYear(), t.getMonth() - k + 1, 0);
      const a = ymd(ms), b = ymd(me) > today ? today : ymd(me);
      let sum = 0, c = 0, dn = 0, tot = 0;
      if (a <= today) eachDay(a, b, (d) => { const i = info(data, d); if (i.counts) { sum += i.pct; c++; dn += i.done; tot += i.total; } });
      const v = c ? (sum / c) * 100 : 0, label = ms.toLocaleDateString(undefined, { month: 'short' }), tip = ms.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      items.push({ label, tip, v, none: !c, tone: !c ? 'none' : v >= data.goal ? 'good' : v > 0 ? 'warn' : 'bad' });
      stack.push({ label, tip, v: dn, rest: tot - dn, tone: 'accent' });
      foc.push({ label, tip, v: a <= today ? focusMins(data, a, b) : 0, tone: 'teal' });
    }
  } else {
    const n = +range;
    for (let k = n - 1; k >= 0; k--) {
      const dd = addDays(t, -k), d = ymd(dd), i = info(data, d);
      const label = n === 7 ? DOW[dow0(d)] : String(dd.getDate()), tip = fmt(d, { weekday: 'short', month: 'short', day: 'numeric' });
      items.push({ label, tip, v: i.pct * 100, none: !i.counts, tone: tone(d) });
      stack.push({ label, tip, v: i.done, rest: i.total - i.done, tone: i.complete ? 'good' : 'accent' });
      foc.push({ label, tip, v: data.focus[d]?.m || 0, tone: 'teal' });
    }
  }
  const withT = items.filter((i) => !i.none);
  const avg = withT.length ? Math.round(withT.reduce((a, b) => a + b.v, 0) / withT.length) : 0;
  const doneSum = stack.reduce((a, b) => a + b.v, 0), focusSum = foc.reduce((a, b) => a + b.v, 0);
  const from = range === '12' ? ymd(new Date(t.getFullYear(), t.getMonth() - 11, 1)) : shift(today, -(+range - 1));
  const hit = countComplete(data, from, today);
  const dw = Array.from({ length: 7 }, () => ({ s: 0, c: 0 }));
  eachDay(firstDate(data), today, (d) => { const i = info(data, d); if (i.counts) { dw[dow0(d)].s += i.pct; dw[dow0(d)].c++; } });
  const dwv = dw.map((x) => (x.c ? (x.s / x.c) * 100 : 0));
  const bi = dwv.indexOf(Math.max(...dwv));
  const worst = dwv.reduce((w, v, i) => (dw[i].c && v < dwv[w] ? i : w), bi);
  const weekday: Pt[] = DOW.map((l, i) => ({ label: l, tip: DOWL[i], v: dwv[i], none: !dw[i].c, tone: i === bi ? 'teal' : 'accent' }));

  return (
    <>
      <Seg value={range} onChange={setRange} options={[{ v: '7', label: '7 days' }, { v: '30', label: '30 days' }, { v: '12', label: '12 months' }]} />
      <div className="tiles">
        <Stat tone="accent" icon={TrendingUp} value={`${avg}%`} label="Avg completion" />
        <Stat tone="good" icon={CheckCheck} value={doneSum} label="Tasks done" />
        <Stat tone="bad" icon={Flame} value={hit} label="Days goal hit" />
        <Stat tone="teal" icon={Timer} value={fmtMins(focusSum)} label="Focus time" />
      </div>
      <div className="card chart-card">
        <div className="ch"><h3>Last 6 months</h3><small>Each square is a day</small><span style={{ flex: 1 }} />
          <span className="heat-legend">Less <i style={{ background: 'var(--track)' }} /><i style={{ background: 'color-mix(in srgb,var(--accent) 55%,var(--track))' }} /><i style={{ background: 'color-mix(in srgb,var(--accent) 80%,var(--track))' }} /><i style={{ background: 'var(--accent)' }} /> Goal hit <i style={{ background: 'var(--sky-soft)', outline: '1px solid var(--sky)' }} /> Rest</span></div>
        <Heatmap data={data} today={today} />
      </div>
      <div className="charts2">
        <div className="card chart-card"><div className="ch"><h3>Completion rate</h3></div><Chart data={items} kind="pct" />
          <div className="legend" style={{ marginTop: 0 }}><span><i style={{ background: 'var(--good)' }} />Goal hit</span><span><i style={{ background: 'var(--warn)' }} />Partial</span><span><i style={{ background: 'var(--bad)' }} />Missed</span></div></div>
        <div className="card chart-card"><div className="ch"><h3>Done vs scheduled</h3></div><Chart data={stack} kind="stack" />
          <div className="legend" style={{ marginTop: 0 }}><span><i style={{ background: 'var(--accent)' }} />Done</span><span><i style={{ background: 'var(--good)' }} />Full day</span><span><i style={{ background: 'var(--track)' }} />Not done</span></div></div>
        <div className="card chart-card"><div className="ch"><h3>Focus time</h3><small>{fmtMins(focusSum)} total</small></div><Chart data={foc} kind="mins" /></div>
        <div className="card chart-card"><div className="ch"><h3>Best days of the week</h3><small>All time</small></div><Chart data={weekday} kind="pct" /></div>
      </div>
      {dwv[bi] > 0 && (
        <div className="insight"><Trophy size={20} /><span>You're most consistent on {DOWL[bi]}s, averaging {Math.round(dwv[bi])}% completion.{worst !== bi && dwv[bi] - dwv[worst] > 25 ? ` ${DOWL[worst]}s need the most help.` : ''}</span></div>
      )}
    </>
  );
}

function Badges() {
  const data = useApp((s) => s.data);
  const today = useClock((s) => s.day);
  const lv = level(data), cur = streak(data);
  const list = BADGES.map((b) => ({ ...b, ...badgeProgress(data, b) }));
  const earned = list.filter((b) => b.earned).length;
  return (
    <>
      <section className="card lvl-card">
        <Medal label={lv} on size={96} />
        <div className="flex w-full min-w-0 flex-col gap-2">
          <span className="eyebrow">{earned} of {BADGES.length} badges · {xp(data)} XP</span>
          <h2>Level {lv} · {levelName(lv)}</h2>
          <div className="bar"><motion.i initial={{ width: 0 }} animate={{ width: `${levelPct(data) * 100}%` }} transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }} /></div>
          <span className="hint num">{LVL - (xp(data) % LVL)} XP to level {lv + 1}. Earn XP: 10 per task, 5 per todo, 1 per focus minute.</span>
        </div>
      </section>
      <div className="prog3">
        <div className="pcard" style={{ background: 'var(--n-blue)' }}><small>This week</small><b className="num">{countComplete(data, weekStart(today), today)}</b><span>days goal hit</span></div>
        <div className="pcard" style={{ background: 'var(--n-purple)' }}><small>This month</small><b className="num">{countComplete(data, today.slice(0, 8) + '01', today)}</b><span>days goal hit</span></div>
        <div className="pcard" style={{ background: 'var(--n-yellow)' }}><small>This year</small><b className="num">{countComplete(data, today.slice(0, 4) + '-01-01', today)}</b><span>days goal hit</span></div>
      </div>
      <section className="sec">
        <div className="sec-head"><h2>Badges</h2><span className="sp" /><span className="tag accent num"><Flame />{cur}-day streak now</span></div>
        <div className="badges">
          {list.map((b, i) => (
            <motion.div key={b.k} className={cn('badge', !b.earned && 'locked')} title={b.t}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: b.earned ? 1 : 0.55, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Medal label={b.type === 'focus' ? `${b.d / 60}h` : b.d} on={b.earned} />
              <b>{b.n}</b><small>{b.earned ? 'Unlocked' : b.t}</small>
              {!b.earned && <><div className="bar thin"><i style={{ width: `${b.pct * 100}%` }} /></div><small className="num">{b.type === 'focus' ? `${fmtMins(b.v)} / ${fmtMins(b.d)}` : `${b.v} / ${b.d}`}</small></>}
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}

export default function Insights({ tab: initial = 'progress' }: { tab?: 'progress' | 'badges' }) {
  const [tab, setTab] = useState(initial);
  return (
    <>
      <div className="page-head">
        <div><h1>Insights</h1><p>{tab === 'progress' ? 'How your days are going, at a glance.' : 'Levels and badges you earn by showing up.'}</p></div>
        <Seg inline value={tab} onChange={setTab} options={[{ v: 'progress', label: <><ChartColumn size={15} />Progress</> }, { v: 'badges', label: <><Trophy size={15} />Badges</> }]} />
      </div>
      {tab === 'progress' ? <Progress /> : <Badges />}
    </>
  );
}
