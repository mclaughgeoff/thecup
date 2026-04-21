'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      // Silent: dev environments without HTTPS or permission issues shouldn't error-log users.
      console.warn('SW registration failed', err);
    });
  }, []);
  return null;
}
