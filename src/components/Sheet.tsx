import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useUI } from '../store/ui';
import { cn } from '../lib/cn';

/** Accessible modal (Radix Dialog): focus trap, Escape to close, screen-reader labels. Becomes a bottom sheet on phones. */
export function Sheet({ title, sub, children, wide, onClose }: { title: string; sub?: ReactNode; children: ReactNode; wide?: boolean; onClose?: () => void }) {
  const close = onClose ?? useUI.getState().close;
  return (
    <Dialog.Root open onOpenChange={(o) => { if (!o) close(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <div className="modal-wrap">
          <Dialog.Content className={cn('sheet', wide && 'wide')} aria-describedby={undefined}
            onOpenAutoFocus={(e) => { const el = (e.currentTarget as HTMLElement).querySelector<HTMLElement>('[data-autofocus]'); if (el && innerWidth >= 620) { e.preventDefault(); el.focus(); } else if (innerWidth < 620) e.preventDefault(); }}>
            <div className="sheet-head">
              <div><Dialog.Title asChild><h2>{title}</h2></Dialog.Title>{sub && <div className="sub">{sub}</div>}</div>
              <Dialog.Close className="icon-btn" aria-label="Close"><X size={18} /></Dialog.Close>
            </div>
            {children}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
