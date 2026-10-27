import { Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../store/app';

/** Sign-in / loading screen, shown only when Firebase is configured. */
export function Gate() {
  const auth = useApp((s) => s.auth);
  const msg = useApp((s) => s.authMessage);
  if (auth === 'local' || auth === 'ready') return null;
  const text = auth === 'loading' ? 'Loading your streak…' : msg || 'Your routines, todos and notes, on every device. Sign in to continue.';
  return (
    <div className="gate">
      <motion.div className="gate-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="logo"><Flame size={30} /></div>
        <h1>StreakFire</h1>
        <p role="status">{text}</p>
        {auth === 'signed-out' && <button className="btn accent" onClick={async () => (await import('../lib/cloud')).signInWithGoogle()}>Sign in with Google</button>}
        {(auth === 'denied' || auth === 'error') && <button className="btn sm ghost" onClick={async () => (await import('../lib/cloud')).signOutUser()}>Use a different account</button>}
      </motion.div>
    </div>
  );
}
