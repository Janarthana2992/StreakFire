import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { AlertCircle, Calendar, CheckCheck, Inbox, ListTodo, Plus } from 'lucide-react';
import { useApp } from '../store/app';
import { useClock, useUI } from '../store/ui';
import type { Todo } from '../lib/types';
import { TodoRow } from '../components/TaskRow';
import { Empty, Seg, Stat } from '../components/ui';

const PR = { high: 0, medium: 1, low: 2 };
const by = (a: Todo, b: Todo) => (a.deadline || '').localeCompare(b.deadline || '') || PR[a.priority] - PR[b.priority];

export default function Todos() {
  const todos = useApp((s) => s.data.todos);
  const today = useClock((s) => s.day);
  const open = useUI((s) => s.open);
  const [tab, setTab] = useState<'pending' | 'done'>('pending');
  const pend = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
  const groups: [string, string, Todo[]][] = [
    ['Overdue', 'bad', pend.filter((t) => t.deadline && t.deadline < today)],
    ['Today', 'accent', pend.filter((t) => t.deadline === today)],
    ['Upcoming', '', pend.filter((t) => t.deadline && t.deadline > today)],
    ['Someday', '', pend.filter((t) => !t.deadline)],
  ];
  return (
    <>
      <div className="page-head"><div><h1>Todos</h1><p>One-off tasks with an optional deadline.</p></div>
        <button className="btn accent" onClick={() => open({ type: 'todo' })}><Plus size={16} />New todo</button></div>
      <div className="stat-row">
        <Stat tone="teal" icon={Inbox} value={pend.length} label="Pending" />
        <Stat tone="warn" icon={Calendar} value={groups[1][2].length} label="Due today" />
        <Stat tone="bad" icon={AlertCircle} value={groups[0][2].length} label="Overdue" />
        <Stat tone="good" icon={CheckCheck} value={done.length} label="Completed" />
      </div>
      <Seg value={tab} onChange={setTab} options={[{ v: 'pending', label: <>Pending <span className="num">{pend.length}</span></> }, { v: 'done', label: <>Done <span className="num">{done.length}</span></> }]} />
      {tab === 'pending'
        ? pend.length
          ? groups.filter((g) => g[2].length).map(([n, c, l]) => (
            <div key={n} className="sec"><div className={`group-h ${c}`}>{n} <span className="num">· {l.length}</span></div>
              <ul className="list"><AnimatePresence initial={false}>{[...l].sort(by).map((t) => <TodoRow key={t.id} t={t} />)}</AnimatePresence></ul></div>))
          : <Empty icon={CheckCheck} title="All clear"><span>Add a todo for anything that needs doing once.</span></Empty>
        : done.length
          ? <ul className="list">{done.map((t) => <TodoRow key={t.id} t={t} />)}</ul>
          : <Empty icon={ListTodo} title="Nothing finished yet"><span>Completed todos show up here.</span></Empty>}
    </>
  );
}
