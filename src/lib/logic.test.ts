import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { parseQuick } from './parse';
import { bestStreak, info, repeatLabel, streak, tasksFor } from './domain';
import { blank, normalize } from './seed';
import type { Data } from './types';

// Fixed "today": Tuesday 27 Oct 2026, 09:00 local time.
beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 9, 27, 9, 0)); });
afterAll(() => vi.useRealTimers());

describe('parseQuick', () => {
  it('reads time, weekday repeat and priority', () => {
    const p = parseQuick('Standup 10am weekdays !high');
    expect(p).toMatchObject({ title: 'Standup', time: '10:00', days: [0, 1, 2, 3, 4], priority: 'high' });
  });
  it('reads relative dates', () => {
    expect(parseQuick('Client call 3:30pm tomorrow')).toMatchObject({ title: 'Client call', time: '15:30', date: '2026-10-28', days: null });
    expect(parseQuick('Pay rent on fri').date).toBe('2026-10-30');
    expect(parseQuick('Retro next tue').date).toBe('2026-11-03');
    expect(parseQuick('Review in 3 days').date).toBe('2026-10-30');
  });
  it('reads custom day lists', () => {
    expect(parseQuick('Gym 7am every mon wed fri').days).toEqual([0, 2, 4]);
    expect(parseQuick('Gym every mon, wed and fri').days).toEqual([0, 2, 4]);
  });
  it('leaves ordinary words alone', () => {
    expect(parseQuick('Monday report draft')).toMatchObject({ title: 'Monday report draft', days: null, time: '' });
  });
});

function withRoutine(days: number[]): Data {
  const d = blank();
  d.routines.push({ id: 'r', title: 'Work', from: '2026-10-01', to: null, time: '', days, priority: '', note: '', subs: [] });
  return d;
}

describe('streak rules', () => {
  it('skips days with no tasks instead of breaking the streak', () => {
    const d = withRoutine([0, 1, 2, 3, 4]); // weekdays only
    for (const day of ['2026-10-21', '2026-10-22', '2026-10-23', '2026-10-26']) d.done[day] = ['r']; // Wed Thu Fri, (weekend), Mon
    expect(streak(d)).toBe(4);
  });
  it('counts today only once it is complete', () => {
    const d = withRoutine([0, 1, 2, 3, 4, 5, 6]);
    d.done['2026-10-26'] = ['r'];
    expect(streak(d)).toBe(1);
    const d2 = structuredClone(d); d2.done['2026-10-27'] = ['r'];
    expect(streak(d2)).toBe(2);
  });
  it('rest days pause the streak', () => {
    const d = withRoutine([0, 1, 2, 3, 4, 5, 6]);
    d.done['2026-10-24'] = ['r']; d.rest['2026-10-25'] = true; d.done['2026-10-26'] = ['r'];
    expect(streak(d)).toBe(2);
    expect(info(d, '2026-10-25').counts).toBe(false);
  });
  it('a missed day breaks it, and best streak remembers', () => {
    const d = withRoutine([0, 1, 2, 3, 4, 5, 6]);
    ['2026-10-20', '2026-10-21', '2026-10-22'].forEach((x) => { d.done[x] = ['r']; });
    d.done['2026-10-26'] = ['r'];
    expect(streak(d)).toBe(1);
    expect(bestStreak(d)).toBe(3);
  });
  it('honours the 80% goal', () => {
    const d = blank(); d.goal = 80;
    for (let i = 0; i < 5; i++) d.routines.push({ id: 'r' + i, title: 'T' + i, from: '2026-10-01', to: null, time: '', days: [0, 1, 2, 3, 4, 5, 6], priority: '', note: '', subs: [] });
    d.done['2026-10-26'] = ['r0', 'r1', 'r2', 'r3'];
    expect(info(d, '2026-10-26').complete).toBe(true);
  });
});

describe('routines', () => {
  it('only appear on their days and within their date range', () => {
    const d = withRoutine([5, 6]);
    expect(tasksFor(d, '2026-10-27')).toHaveLength(0); // Tuesday
    expect(tasksFor(d, '2026-10-31')).toHaveLength(1); // Saturday
    d.routines[0].to = '2026-10-31';
    expect(tasksFor(structuredClone(d), '2026-10-31')).toHaveLength(0);
  });
  it('labels repeats', () => {
    expect(repeatLabel([0, 1, 2, 3, 4, 5, 6])).toBe('Daily');
    expect(repeatLabel([0, 1, 2, 3, 4])).toBe('Weekdays');
    expect(repeatLabel([0, 2, 4])).toBe('Mon, Wed, Fri');
  });
  it('normalizes old v2 data', () => {
    const d = normalize({ routines: [{ id: 'x', title: 'Old', from: '2026-01-01', to: null }], done: {} });
    expect(d.routines[0].days).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(d.v).toBe(3);
  });
});
