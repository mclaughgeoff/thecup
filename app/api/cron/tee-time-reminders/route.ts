import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isGone, sendPush, type PushTarget } from '@/lib/push';

export const dynamic = 'force-dynamic';

/** Parse "8:15 AM" → minutes-since-midnight. Returns null if unparseable. */
function parseClock(s: string): number | null {
  const m = s.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let h = Number(m[1]);
  const mm = Number(m[2]);
  const ampm = m[3].toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + mm;
}

/**
 * Runs every 5 minutes. Finds matches whose tee time is 30–35 minutes from now
 * (same day as server local), sends push to every player in the match, and
 * records a TeeTimeNotification row to prevent duplicate sends.
 *
 * Vercel Cron authenticates via `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  const authz = req.headers.get('authorization') ?? '';
  if (authz !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const windowStart = nowMins + 30;
  const windowEnd = nowMins + 35;

  const matches = await prisma.match.findMany({
    where: {
      teeTimeNotification: null,
      round: { date: { gte: todayStart, lt: todayEnd } },
    },
    include: {
      round: true,
      players: { include: { player: { include: { pushSubscriptions: true } } } },
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  const sent: Array<{ matchId: string; sends: number; removed: number }> = [];

  for (const m of matches) {
    const teeTime = m.round.teeSlots?.[m.teeSlotIndex ?? 0] ?? m.round.teeTime;
    const mins = parseClock(teeTime);
    if (mins == null) continue;
    if (mins < windowStart || mins > windowEnd) continue;

    const deepLink = `${baseUrl}/live/${m.id}`;
    let sends = 0;
    let removed = 0;
    for (const mp of m.players) {
      for (const sub of mp.player.pushSubscriptions) {
        const target: PushTarget = { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth };
        const result = await sendPush(target, {
          title: `Tee time in ${mins - nowMins} min`,
          body: `${m.round.course} · ${teeTime} · Round ${m.round.roundNumber} Match ${m.matchNumber}`,
          url: `/live/${m.id}`,
          tag: `match-${m.id}`,
        });
        if (result.ok) {
          sends++;
        } else if (isGone(result)) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          removed++;
        }
      }
    }

    await prisma.teeTimeNotification.upsert({
      where: { matchId: m.id },
      create: { matchId: m.id },
      update: {},
    });
    sent.push({ matchId: m.id, sends, removed });
    void deepLink;
  }

  return NextResponse.json({ ok: true, at: now.toISOString(), processed: matches.length, sent });
}
