import { toast } from 'sonner';

/** Shows an in-app toast and, if allowed, a system notification (via the service worker when available). */
export async function notify(title: string, body = '', inApp = true) {
  if (inApp) toast(title, { description: body || undefined });
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (reg) await reg.showNotification(title, { body, icon: 'icon.svg', badge: 'icon.svg', tag: title });
    else new Notification(title, { body, icon: 'icon.svg' });
  } catch { /* notifications unavailable */ }
}
export const notifyPermission = () => ('Notification' in window ? Notification.permission : 'unsupported');
export async function askNotify() {
  if ('Notification' in window && Notification.permission === 'default') return Notification.requestPermission();
  return notifyPermission();
}
