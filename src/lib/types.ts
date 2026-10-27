export type Priority = '' | 'low' | 'medium' | 'high';
export type TodoPriority = Exclude<Priority, ''>;
export type ThemePref = 'system' | 'light' | 'dark';
export type PaletteId = 'indigo' | 'emerald' | 'ocean' | 'sunset' | 'rose';
export type NoteCat = 'personal' | 'ideas' | 'work' | 'goals' | 'habits';
export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple';

export interface Sub { id: string; t: string }

interface TaskBase {
  id: string;
  title: string;
  time: string; // "HH:MM" or ""
  priority: Priority;
  note: string;
  subs: Sub[];
}
/** A repeating task. Active from `from` (inclusive) until `to` (exclusive), on the given weekdays (0 = Monday). */
export interface Routine extends TaskBase { from: string; to: string | null; days: number[] }
/** A task for one specific date. */
export interface OneTask extends TaskBase { date: string }

/** A task as it appears on a given day. */
export interface DayTask extends TaskBase { routine: boolean; days?: number[] }

export interface Todo {
  id: string; title: string; details: string; deadline: string;
  priority: TodoPriority; done: boolean; doneAt?: number; created: number;
}
export interface Note {
  id: string; cat: NoteCat; color: NoteColor; title: string; body: string; pinned: boolean; updated: number;
}
export interface FocusDay { m: number; by?: Record<string, number> }

/** Everything the user owns. Stored as one JSON document (compatible with StreakFire v3). */
export interface Data {
  v: 3;
  name: string;
  theme: ThemePref;
  palette: PaletteId; // colour theme
  sample: boolean;
  goal: number; // % of tasks needed for a day to count
  remind: boolean;
  remindAt: string;
  focusLen: number;
  routines: Routine[];
  tasks: OneTask[];
  done: Record<string, string[]>;
  subDone: Record<string, Record<string, string[]>>;
  rest: Record<string, boolean>;
  focus: Record<string, FocusDay>;
  reviews: Record<string, { note: string }>;
  carry: Record<string, boolean>;
  todos: Todo[];
  notes: Note[];
  quote: number;
}

export interface DayInfo { total: number; done: number; pct: number; rest: boolean; counts: boolean; complete: boolean }
