import { useApp } from '../store/app';

const LABEL = { local: 'Saved on this device', saving: 'Saving…', saved: 'Synced', offline: 'Offline, will sync', error: 'Sync error' } as const;

export function SyncBadge() {
  const s = useApp((x) => x.sync);
  return <span className={`sync ${s}`} role="status"><i />{LABEL[s]}</span>;
}
