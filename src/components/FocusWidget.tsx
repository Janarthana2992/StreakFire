import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Pause, Play, Square, Timer } from 'lucide-react';
import { focusLeft, useFocus } from '../store/focus';
import { fmtClock } from '../lib/dates';

/** Floating focus timer. Survives reloads (stored locally) and shows the time in the tab title. */
export function FocusWidget() {
  const { session: s, pause, resume, end } = useFocus();
  const [, force] = useState(0);
  useEffect(() => {
    if (!s) { document.title = document.title.replace(/^\d\d:\d\d · /, ''); return; }
    const id = setInterval(() => {
      const left = focusLeft(useFocus.getState().session);
      document.title = `${fmtClock(left)} · ${document.title.replace(/^\d\d:\d\d · /, '')}`;
      if (left <= 0) end(true); else force((n) => n + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [s, end]);
  const left = focusLeft(s), r = 20, C = 2 * Math.PI * r;
  return (
    <AnimatePresence>
      {s && (
        <motion.div className="focus" role="timer" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}>
          <div className="fr">
            <svg viewBox="0 0 48 48"><circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth="4" />
              <circle cx="24" cy="24" r={r} fill="none" stroke="var(--accent-2)" strokeWidth="4" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (left / (s.len * 60000))} /></svg>
            <span>{s.pausedAt ? <Pause size={16} /> : <Timer size={16} />}</span>
          </div>
          <div className="ft"><b className="num">{fmtClock(left)}</b><small>{s.pausedAt ? 'Paused · ' : ''}{s.title}</small></div>
          <button className="icon-btn" onClick={s.pausedAt ? resume : pause} aria-label={s.pausedAt ? 'Resume' : 'Pause'}>{s.pausedAt ? <Play size={16} /> : <Pause size={16} />}</button>
          <button className="icon-btn" onClick={() => end(false)} aria-label="Stop and log time"><Square size={16} /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
