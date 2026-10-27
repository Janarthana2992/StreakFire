import type { Priority } from './types';
import { dow0, pad, shift, today } from './dates';
import { ALL, WEEKDAYS } from './domain';

export interface Quick { title: string; time: string; days: number[] | null; date: string; priority: Priority; dateSet: boolean }
const KS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/**
 * Natural-language quick add.
 * "Standup 10am weekdays", "Client call 3pm tomorrow !high", "Gym 7am every mon wed fri", "Pay rent on fri".
 */
export function parseQuick(raw: string, baseDate?: string): Quick {
  let s = ` ${raw} `;
  let m: RegExpMatchArray | null;
  let time = '', days: number[] | null = null, date = baseDate || today(), priority: Priority = '', dateSet = false;
  const cut = (x: string) => { s = s.replace(x, ' '); };

  if ((m = s.match(/\s(?:at\s|@)?(\d{1,2})(?::([0-5]\d))?\s?(am|pm)(?=\s)/i))) {
    let h = +m[1];
    if (h >= 1 && h <= 12) { h = (h % 12) + (m[3].toLowerCase() === 'pm' ? 12 : 0); time = `${pad(h)}:${m[2] || '00'}`; cut(m[0]); }
  } else if ((m = s.match(/\s(?:at\s|@)([01]?\d|2[0-3])(?::?([0-5]\d))?(?=\s)/i)) || (m = s.match(/\s([01]?\d|2[0-3]):([0-5]\d)(?=\s)/))) {
    time = `${pad(+m[1])}:${m[2] || '00'}`; cut(m[0]);
  }

  if ((m = s.match(/\s(every\s?day|daily)(?=\s)/i))) { days = ALL.slice(); cut(m[0]); }
  else if ((m = s.match(/\s(?:every\s)?(weekdays?|workdays?|mon-fri)(?=\s)/i))) { days = WEEKDAYS.slice(); cut(m[0]); }
  else if ((m = s.match(/\s(?:every\s)?weekends?(?=\s)/i))) { days = [5, 6]; cut(m[0]); }
  else if ((m = s.match(/\severy\s((?:(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?(?:\s*(?:,|and|&|\/)\s*|\s+)?)+)/i))) {
    const found = [...new Set((m[1].toLowerCase().match(/mon|tue|wed|thu|fri|sat|sun/g) || []).map((x) => KS.indexOf(x)))].sort();
    if (found.length) { days = found; cut(m[0]); }
  }

  if ((m = s.match(/\s!(high|h|1|medium|med|m|2|low|l|3)(?=\s)/i))) {
    const v = m[1].toLowerCase();
    priority = /^(high|h|1)$/.test(v) ? 'high' : /^(low|l|3)$/.test(v) ? 'low' : 'medium';
    cut(m[0]);
  }

  if (!days) {
    if ((m = s.match(/\s(today|tonight)(?=\s)/i))) { date = today(); dateSet = true; cut(m[0]); }
    else if ((m = s.match(/\s(tomorrow|tmrw|tmr)(?=\s)/i))) { date = shift(today(), 1); dateSet = true; cut(m[0]); }
    else if ((m = s.match(/\s(on|next|this)\s(mon|tue|wed|thu|fri|sat|sun)[a-z]*(?=\s)/i))) {
      const t = today(); let diff = (KS.indexOf(m[2].toLowerCase()) - dow0(t) + 7) % 7;
      if (m[1].toLowerCase() === 'next' && diff === 0) diff = 7;
      date = shift(t, diff); dateSet = true; cut(m[0]);
    } else if ((m = s.match(/\sin\s(\d{1,2})\sdays?(?=\s)/i))) { date = shift(today(), +m[1]); dateSet = true; cut(m[0]); }
  }
  return { title: s.replace(/\s+/g, ' ').trim(), time, days, date, priority, dateSet };
}
