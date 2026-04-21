import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function authStatus(msg: string) {
  if (msg === 'Unauthorized') return 401;
  if (msg === 'Admin access required') return 403;
  return 500;
}

type Entry = { playerId: string; roundId: string; available: boolean };

export async function GET() {
  try {
    await requireAdmin();
    const [players, rounds, availability] = await Promise.all([
      prisma.player.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, photoUrl: true },
      }),
      prisma.round.findMany({
        orderBy: { date: 'asc' },
        select: {
          id: true,
          roundNumber: true,
          dayOfWeek: true,
          timeSlot: true,
          course: true,
          teeTime: true,
          format: true,
          isRyderCup: true,
        },
      }),
      prisma.roundAvailability.findMany({
        select: { playerId: true, roundId: true, available: true },
      }),
    ]);

    // Map: `${playerId}:${roundId}` → available
    const map: Record<string, boolean> = {};
    for (const a of availability) {
      map[`${a.playerId}:${a.roundId}`] = a.available;
    }

    return NextResponse.json({ players, rounds, availability: map });
  } catch (error) {
    const m = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: m }, { status: authStatus(m) });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = (await request.json()) as { entries?: Entry[] };
    if (!Array.isArray(body.entries)) {
      return NextResponse.json({ error: 'entries must be an array' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      for (const e of body.entries!) {
        if (!e.playerId || !e.roundId) continue;
        await tx.roundAvailability.upsert({
          where: { playerId_roundId: { playerId: e.playerId, roundId: e.roundId } },
          create: { playerId: e.playerId, roundId: e.roundId, available: Boolean(e.available) },
          update: { available: Boolean(e.available) },
        });
      }
    });

    return NextResponse.json({ success: true, updated: body.entries.length });
  } catch (error) {
    const m = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: m }, { status: authStatus(m) });
  }
}
