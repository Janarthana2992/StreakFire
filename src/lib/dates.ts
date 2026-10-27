/** All dates are local-time "YYYY-MM-DD" strings, so comparisons are plain string comparisons. */
export const pad = (n: number) => String(n).padStart(2, '0');
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (d: Date | string, n: number) => { const x = typeof d === 'string' ? parse(d) : new Date(d); x.setDate(x.getDate() + n); return x; };
export const shift = (s: string, n: number) => ymd(addDays(s, n));
export const today = () => ymd(new Date());
export const fmt = (s: string, o: Intl.DateTimeFormatOptions) => parse(s).toLocaleDateString(undefined, o);
export const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DOWL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
/** Weekday index with Monday = 0. */
export const dow0 = (s: string) => (parse(s).getDay() + 6) % 7;
export const weekStart = (s: string) => shift(s, -dow0(s));
export const t12 = (t: string) => { if (!t) return ''; const [h, m] = t.split(':').map(Number); return `${(h % 12) || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`; };
export const mins = (hm: string) => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
export const nowMins = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
export function eachDay(from: string, to: string, fn: (d: string) => void) {
  const d = parse(from);
  for (let s = ymd(d), guard = 0; s <= to && guard < 4000; guard++) { fn(s); d.setDate(d.getDate() + 1); s = ymd(d); }
}
export function relDay(d: string) {
  const t = today();
  if (d === t) return 'Today';
  if (d === shift(t, 1)) return 'Tomorrow';
  if (d === shift(t, -1)) return 'Yesterday';
  const diff = Math.round((parse(d).getTime() - parse(t).getTime()) / 864e5);
  if (diff > 0 && diff < 7) return fmt(d, { weekday: 'long' });
  return fmt(d, { weekday: 'short', month: 'short', day: 'numeric' });
}
export const fmtMins = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m`);
export const fmtClock = (ms: number) => { const s = Math.ceil(ms / 1000); return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; };
