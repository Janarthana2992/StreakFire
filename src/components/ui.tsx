import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { DayInfo, Priority } from '../lib/types';
import { PRI } from '../lib/domain';
import { cn } from '../lib/cn';

export function Ring({ pct, full }: { pct: number; full?: boolean }) {
  const stroke = 14, r = (100 - stroke) / 2, C = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r={r} fill="none" strokeWidth={stroke} className="ring-track" />
      <circle cx="50" cy="50" r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" className={cn('ring-val', full && 'full')}
        strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(1, pct))} />
    </svg>
  );
}

export function MiniRing({ i }: { i: DayInfo }) {
  const r = 16, C = 2 * Math.PI * r;
  const col = i.rest ? 'var(--sky)' : i.complete ? 'var(--good)' : i.done ? 'var(--warn)' : 'var(--line-2)';
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r={r} fill="none" stroke="var(--track)" strokeWidth="4" />
      {i.total > 0 && !i.rest && <circle cx="20" cy="20" r={r} fill="none" stroke={col} strokeWidth="4" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - i.pct)} />}
    </svg>
  );
}

export function Medal({ label, on, size = 64 }: { label: string | number; on: boolean; size?: number }) {
  const L = String(label), fs = L.length > 3 ? 13 : L.length > 2 ? 15 : 18;
  return (
    <svg className="medal" style={{ width: size, height: size }} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M21 3h9l4 14h-9zM43 3h-9l-4 14h9z" fill={on ? 'var(--grad-c)' : 'var(--line-2)'} opacity=".75" />
      <circle cx="32" cy="38" r="22" fill={on ? 'url(#medalGrad)' : 'var(--track)'} />
      <circle cx="32" cy="38" r="16.5" fill="none" stroke="#fff" strokeOpacity={on ? 0.45 : 0} strokeWidth="1.5" strokeDasharray="2 3" />
      <text x="32" y="43" textAnchor="middle" fontFamily="Bricolage Grotesque, sans-serif" fontWeight="800" fontSize={fs} fill={on ? '#fff' : 'var(--muted)'}>{L}</text>
    </svg>
  );
}

export function Stat({ tone, icon: Icon, value, label }: { tone: string; icon: LucideIcon; value: ReactNode; label: string }) {
  return (
    <div className={`stat s-${tone}`}>
      <div className="top"><div className="i"><Icon size={18} /></div></div>
      <div><b className="num">{value}</b><span>{label}</span></div>
    </div>
  );
}

export function Seg<T extends string | number>({ value, onChange, options, inline, className }: {
  value: T; onChange: (v: T) => void; options: { v: T; label: ReactNode }[]; inline?: boolean; className?: string;
}) {
  return (
    <div className={cn('seg', inline && 'inline', className)} role="tablist">
      {options.map((o) => (
        <button key={String(o.v)} type="button" role="tab" aria-selected={o.v === value} className={o.v === value ? 'on' : ''} onClick={() => onChange(o.v)}>{o.label}</button>
      ))}
    </div>
  );
}

export function Empty({ icon: Icon, title, children, compact }: { icon: LucideIcon; title?: string; children?: ReactNode; compact?: boolean }) {
  return (
    <div className="empty" style={compact ? { padding: 20 } : undefined}>
      <Icon size={compact ? 24 : 28} />
      {title && <b>{title}</b>}
      {children}
    </div>
  );
}

export function PriTag({ p }: { p: Priority }) {
  if (!p) return null;
  return <span className={`tag ${PRI[p].c}`}>{PRI[p].l}</span>;
}
export const PriDot = ({ p }: { p: Exclude<Priority, ''> }) => <i style={{ width: 8, height: 8, borderRadius: '50%', background: `var(--${PRI[p].c})` }} />;
