import webpush from 'web-push';

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

let configured = false;

/** Lazy-configure once. No-ops if keys are missing (dev without VAPID). */
function ensureConfigured(): boolean {
  if (configured) return true;
  if (!publicKey || !privateKey || !subject) {
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  /** Relative URL the notification should open. */
  url: string;
  /** Optional tag so multiple sends collapse to one banner. */
  tag?: string;
}

export type PushResult = { ok: true } | { ok: false; status?: number; error: string };

/**
 * Send a single push message. Returns `ok: false` on any error so callers can
 * react (e.g. delete the subscription if 404/410 gone).
 */
export async function sendPush(target: PushTarget, payload: PushPayload): Promise<PushResult> {
  if (!ensureConfigured()) {
    return { ok: false, error: 'VAPID not configured' };
  }
  try {
    const res = await webpush.sendNotification(
      {
        endpoint: target.endpoint,
        keys: { p256dh: target.p256dh, auth: target.auth },
      },
      JSON.stringify(payload),
    );
    return { ok: true, status: res.statusCode } as PushResult;
  } catch (err) {
    const e = err as { statusCode?: number; body?: string; message?: string };
    return {
      ok: false,
      status: e.statusCode,
      error: e.body || e.message || 'unknown push error',
    };
  }
}

/** Convenience: was this result caused by a gone/invalid subscription? */
export function isGone(result: PushResult): boolean {
  return !result.ok && (result.status === 404 || result.status === 410);
}
