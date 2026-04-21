import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Body {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = (await req.json()) as Body;
    const endpoint = body.endpoint;
    const p256dh = body.keys?.p256dh;
    const auth = body.keys?.auth;
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'endpoint, keys.p256dh, keys.auth are required' }, { status: 400 });
    }

    const row = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { endpoint, p256dh, auth, playerId: session.playerId },
      update: { p256dh, auth, playerId: session.playerId },
    });

    return NextResponse.json({ ok: true, id: row.id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status = msg === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
