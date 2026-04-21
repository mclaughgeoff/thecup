'use client';

import { useEffect, useState } from 'react';

type Status =
  | 'loading'
  | 'unsupported'
  | 'ios-needs-standalone'
  | 'default'     // permission not yet asked
  | 'granted'     // subscribed or can subscribe silently
  | 'denied'      // user blocked — no prompt shown
  | 'subscribed'  // active subscription matched to this device
  | 'subscribing'
  | 'error';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/** Convert a VAPID base64-url-safe key to the UInt8Array PushManager expects. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64Padded = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64Padded);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function isIos(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
}
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function PushPrompt() {
  const [status, setStatus] = useState<Status>('loading');
  const [err, setErr] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    (async () => {
      if (typeof window === 'undefined') return;
      if (localStorage.getItem('push-prompt-dismissed') === '1') {
        setDismissed(true);
      }
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        setStatus('unsupported');
        return;
      }
      if (isIos() && !isStandalone()) {
        setStatus('ios-needs-standalone');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setStatus('subscribed');
        return;
      }
      const perm = Notification.permission;
      if (perm === 'denied') setStatus('denied');
      else if (perm === 'granted') setStatus('granted');
      else setStatus('default');
    })();
  }, []);

  const subscribe = async () => {
    if (!VAPID_PUBLIC) {
      setStatus('error');
      setErr('VAPID public key missing. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY.');
      return;
    }
    setStatus('subscribing');
    setErr(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setStatus(perm === 'denied' ? 'denied' : 'default');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
      });
      const body = sub.toJSON();
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Subscribe failed: ${res.status}`);
      setStatus('subscribed');
    } catch (e) {
      setStatus('error');
      setErr(e instanceof Error ? e.message : 'Subscribe failed');
    }
  };

  const dismiss = () => {
    localStorage.setItem('push-prompt-dismissed', '1');
    setDismissed(true);
  };

  if (dismissed) return null;
  if (status === 'loading' || status === 'subscribed' || status === 'granted' || status === 'denied' || status === 'unsupported') {
    return null;
  }

  const isIosHelp = status === 'ios-needs-standalone';

  return (
    <section className="px-4 pt-4">
      <div className="rounded-2xl border border-masters/20 bg-masters/5 p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-masters/10 text-masters flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-fg-1">Get notified when your matches start</p>
          {isIosHelp ? (
            <p className="text-sm text-fg-2 mt-1">
              On iPhone, tap <span className="font-semibold">Share</span> → <span className="font-semibold">Add to Home Screen</span>,
              then open The Cup from the home screen icon to enable notifications.
            </p>
          ) : (
            <p className="text-sm text-fg-2 mt-1">
              We'll ping you 30 minutes before each of your tee times.
            </p>
          )}
          {err ? <p className="text-xs text-danger mt-1">{err}</p> : null}
          <div className="flex gap-2 mt-3">
            {!isIosHelp ? (
              <button
                onClick={subscribe}
                disabled={status === 'subscribing'}
                className="btn-primary text-xs py-2 px-4"
              >
                {status === 'subscribing' ? 'Subscribing…' : 'Turn on'}
              </button>
            ) : null}
            <button onClick={dismiss} className="btn-ghost text-xs py-2 px-4">
              Not now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
