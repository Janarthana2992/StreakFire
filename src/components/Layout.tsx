import { NavLink, useLocation, useOutlet } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Flame, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { NAV, isMac } from '../lib/nav';
import { useApp } from '../store/app';
import { useUI } from '../store/ui';
import { bestStreak, level, levelName, levelPct, LVL, overdueTodos, streak, xp } from '../lib/domain';
import { Medal } from './ui';
import { SyncBadge } from './SyncBadge';

function NavLinks({ big }: { big?: boolean }) {
  const od = useApp((s) => overdueTodos(s.data).length);
  return (
    <>
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'on' : '')}>
          <Icon size={big ? 22 : 18} /><span>{label}</span>
          {to === '/todos' && od > 0 && <span className="count num">{od}</span>}
        </NavLink>
      ))}
    </>
  );
}

function Sidebar() {
  const data = useApp((s) => s.data);
  const { open, setPalette } = useUI();
  const lv = level(data);
  return (
    <aside className="side" aria-label="Sidebar">
      <div className="brand"><div className="logo"><Flame size={20} /></div><div><b>StreakFire</b><small>Habits · Todos · Focus</small></div></div>
      <button className="search-btn" onClick={() => setPalette(true)} aria-label="Search and commands"><Search size={18} /><span>Search or jump…</span><kbd>{isMac ? '⌘K' : 'Ctrl K'}</kbd></button>
      <nav className="nav" aria-label="Sections"><NavLinks /></nav>
      <div className="lvl">
        <div className="lvl-top"><Medal label={lv} on size={40} /><div><b>Level {lv} · {levelName(lv)}</b><small className="num">{xp(data) % LVL} / {LVL} XP to level {lv + 1}</small></div></div>
        <div className="bar thin"><motion.i initial={false} animate={{ width: `${levelPct(data) * 100}%` }} /></div>
        <div className="sync" style={{ justifyContent: 'space-between', width: '100%' }}>
          <span className="flex items-center gap-1"><Flame size={14} /> <b className="num text-fg">{streak(data)}</b> day streak</span>
          <span>Best <b className="num text-fg">{bestStreak(data)}</b></span>
        </div>
      </div>
      <button className="me" onClick={() => open({ type: 'settings' })} aria-label="Open profile and settings">
        <div className="avatar">{(data.name || 'Y').trim()[0].toUpperCase()}</div>
        <div className="who"><b>{data.name}</b><SyncBadge /></div>
        <span className="icon-btn sm"><SlidersHorizontal size={18} /></span>
      </button>
    </aside>
  );
}

function TopBar() {
  const data = useApp((s) => s.data);
  const { open, setPalette } = useUI();
  return (
    <header className="topbar">
      <div className="logo"><Flame size={20} /></div><b>StreakFire</b>
      <button className="icon-btn" onClick={() => setPalette(true)} aria-label="Search"><Search size={18} /></button>
      <span className="chip num"><Flame />{streak(data)}</span>
      <button className="avatar" onClick={() => open({ type: 'settings' })} aria-label="Open profile and settings">{(data.name || 'Y').trim()[0].toUpperCase()}</button>
    </header>
  );
}

export function Layout() {
  const loc = useLocation();
  const outlet = useOutlet(); // captured so the exiting page keeps its content during the transition
  const open = useUI((s) => s.open);
  const fab = () => {
    if (loc.pathname.startsWith('/todos')) open({ type: 'todo' });
    else if (loc.pathname.startsWith('/notes')) open({ type: 'note' });
    else open({ type: 'quick' });
  };
  return (
    <div className="app">
      <Sidebar />
      <TopBar />
      <main>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={loc.pathname} className="wrap"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}>
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>
      <nav className="tabbar" aria-label="Sections"><NavLinks big /></nav>
      <motion.button className="fab" whileTap={{ scale: 0.92 }} onClick={fab} aria-label="Add"><Plus size={26} /></motion.button>
    </div>
  );
}
