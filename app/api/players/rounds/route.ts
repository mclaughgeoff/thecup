import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireAuth();

    const rounds = await prisma.round.findMany({
      orderBy: { date: 'asc' },
    });

    const availability = await prisma.roundAvailability.findMany({
      where: { playerId: session.playerId },
    });

    const availableMap: Record<string, boolean> = {};
    for (const a of availability) availableMap[a.roundId] = a.available;

    return NextResponse.json({
      rounds,
      availability: availableMap,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
