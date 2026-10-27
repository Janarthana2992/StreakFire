import { CalendarDays, ChartColumn, ListTodo, StickyNote, Sun } from 'lucide-react';

export const NAV = [
  { to: '/today', label: 'Today', icon: Sun },
  { to: '/plan', label: 'Plan', icon: CalendarDays },
  { to: '/todos', label: 'Todos', icon: ListTodo },
  { to: '/notes', label: 'Notes', icon: StickyNote },
  { to: '/insights', label: 'Insights', icon: ChartColumn },
];
export const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
