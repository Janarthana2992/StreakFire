import { useState } from 'react';
import { motion } from 'motion/react';
import { Pin, Plus, Search, StickyNote, Trash2 } from 'lucide-react';
import { useApp } from '../store/app';
import { useUI } from '../store/ui';
import { CATS } from '../lib/domain';
import { undoToast } from '../lib/actions';
import { Empty } from '../components/ui';
import { cn } from '../lib/cn';

export default function Notes() {
  const notes = useApp((s) => s.data.notes);
  const update = useApp((s) => s.update);
  const open = useUI((s) => s.open);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('all');
  const ql = q.toLowerCase();
  const list = notes
    .filter((n) => (cat === 'all' || n.cat === cat) && (!ql || `${n.title} ${n.body}`.toLowerCase().includes(ql)))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updated - a.updated);
  return (
    <>
      <div className="page-head"><div><h1>Notes</h1><p>Thoughts, goals and ideas, all in one place.</p></div>
        <button className="btn accent" onClick={() => open({ type: 'note' })}><Plus size={16} />New note</button></div>
      <div className="toolbar"><div className="searchbox"><Search size={17} /><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes…" aria-label="Search notes" /></div></div>
      <div className="cats" role="tablist">
        {[['all', 'All'], ...Object.entries(CATS)].map(([k, l]) => (
          <button key={k} className={cat === k ? 'on' : ''} onClick={() => setCat(k)}>{l}<span className="num">{k === 'all' ? notes.length : notes.filter((n) => n.cat === k).length}</span></button>
        ))}
      </div>
      {list.length ? (
        <div className="notes">
          {list.map((n) => (
            <motion.article layout key={n.id} className={`note c-${n.color}`} tabIndex={0} role="button" aria-label={`Edit note ${n.title || 'Untitled'}`}
              onClick={() => open({ type: 'note', id: n.id })} onKeyDown={(e) => { if (e.key === 'Enter') open({ type: 'note', id: n.id }); }}>
              <div className="acts">
                <button className={cn('icon-btn sm', n.pinned && 'pin-on')} aria-label={`${n.pinned ? 'Unpin' : 'Pin'} note`} aria-pressed={n.pinned}
                  onClick={(e) => { e.stopPropagation(); update((x) => { const k = x.notes.find((y) => y.id === n.id)!; k.pinned = !k.pinned; }); }}><Pin size={15} /></button>
                <button className="icon-btn sm del" aria-label="Delete note"
                  onClick={(e) => { e.stopPropagation(); const prev = update((x) => { x.notes = x.notes.filter((y) => y.id !== n.id); }); undoToast('Note deleted', prev); }}><Trash2 size={15} /></button>
              </div>
              <span className="tag muted" style={{ alignSelf: 'flex-start', background: 'color-mix(in srgb,var(--surface) 55%,transparent)' }}>{CATS[n.cat] || 'Note'}</span>
              <h3>{n.title || 'Untitled'}</h3>
              {n.body && <p>{n.body}</p>}
              <div className="foot num"><span>{new Date(n.updated).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>{n.pinned && <span className="pin-on"><Pin size={13} /></span>}</div>
            </motion.article>
          ))}
        </div>
      ) : (
        <Empty icon={StickyNote} title={notes.length ? 'No notes match' : 'No notes yet'}><span>{notes.length ? 'Try another search or category.' : 'Capture a thought, a goal or an idea.'}</span></Empty>
      )}
    </>
  );
}
