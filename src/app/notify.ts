// Phone alerts: turning Web Push on and off on this phone, and which alerts it wants. iPhones only
// allow it from the app added to the Home Screen (iOS 16.4+), so the panel explains that first.
import { BASE } from './state.svelte';
import { device } from './live.svelte';
import type { AlertKind } from '../lib/live';

export type Prefs = Record<AlertKind, boolean>;
export const DEFAULT_PREFS: Prefs = { leave: true, last: true, due: true, changes: true };
const API = `${BASE}/api`;

export const supported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const standalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
/** An iPhone or iPad in Safari, not opened from the Home Screen: push needs the installed app. */
export const needsInstall = () => /iPhone|iPad|iPod/.test(navigator.userAgent) && !standalone();

export function savedPrefs(): Prefs {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem('jt:alert-prefs') ?? '{}') }; } catch { return { ...DEFAULT_PREFS }; }
}
const keepPrefs = (p: Prefs) => { try { localStorage.setItem('jt:alert-prefs', JSON.stringify(p)); } catch { /* fine */ } };

/** Whether alerts were ever turned on on this phone. Until they are, the app never asks the browser for
 *  a subscription: that call can stall a browser where push isn't set up (WebKit froze on it), and a
 *  phone that never turned alerts on has nothing to find. */
const everOn = () => { try { return !!localStorage.getItem('jt:alert-tz'); } catch { return false; } };
async function subscription(): Promise<PushSubscription | null> {
  if (!supported() || !everOn()) return null;
  const reg = await navigator.serviceWorker.getRegistration(`${BASE}/`);
  return (await reg?.pushManager.getSubscription()) ?? null;
}
export const isOn = async () => !!(await subscription()) && Notification.permission === 'granted';

const bytes = (b64u: string) => Uint8Array.from(atob(b64u.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64u.length + 3) % 4)), (c) => c.charCodeAt(0));
async function post(path: string, body: unknown) {
  const r = await fetch(`${API}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15e3) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? `The server said ${r.status}`);
  return j;
}
const zone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
async function register(sub: PushSubscription, prefs: Prefs, name: string) {
  await post('/subscribe', { subscription: sub.toJSON(), device, name, tz: zone(), prefs });
  keepPrefs(prefs);
  try { localStorage.setItem('jt:alert-tz', zone()); } catch { /* fine */ }
}

/** Deadline reminders go out at 9am where the phone is: after a flight to Japan, tell the server the
 *  new time zone (on the next app open with signal). */
export async function keepZone(name: string) {
  try {
    const saved = localStorage.getItem('jt:alert-tz');
    if (!saved || saved === zone()) return; // never turned on here, or no new time zone
    const sub = await subscription();
    if (sub && Notification.permission === 'granted') await register(sub, savedPrefs(), name);
  } catch { /* offline: next time */ }
}

/** Asks for permission (must run from a tap) and subscribes this phone. */
export async function turnOn(prefs: Prefs, name: string): Promise<void> {
  if (!supported()) throw new Error("This browser can't receive alerts.");
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error(permission === 'denied' ? 'Notifications are blocked for this site. Allow them in Settings, then try again.' : 'Alerts stay off until you allow notifications.');
  const { key } = await fetch(`${API}/push-key`).then((r) => r.json());
  if (!key) throw new Error("Alerts aren't set up on the server yet.");
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes(key) }));
  await register(sub, prefs, name);
}
export async function updatePrefs(prefs: Prefs, name: string) {
  keepPrefs(prefs);
  const sub = await subscription();
  if (sub) await register(sub, prefs, name);
}
export async function turnOff() {
  const sub = await subscription();
  if (!sub) return;
  await post('/unsubscribe', { endpoint: sub.endpoint }).catch(() => {});
  await sub.unsubscribe();
  try { localStorage.removeItem('jt:alert-tz'); } catch { /* fine */ }
}
export async function test() {
  const sub = await subscription();
  if (!sub) throw new Error('Alerts are off on this phone.');
  await post('/push-test', { endpoint: sub.endpoint });
}
