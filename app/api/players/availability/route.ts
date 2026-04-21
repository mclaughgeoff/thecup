import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = (await request.json()) as { roundIds?: string[] };

    if (!Array.isArray(body.roundIds)) {
      return NextResponse.json(
        { error: 'roundIds must be an array' },
        { status: 400 }
      );
    }

    const inSet = new Set(body.roundIds);
    const rounds = await prisma.round.findMany({ select: { id: true } });

    await prisma.$transaction(async (tx) => {
      for (const r of rounds) {
        await tx.roundAvailability.upsert({
          where: {
            playerId_roundId: { playerId: session.playerId, roundId: r.id },
          },
          create: {
            playerId: session.playerId,
            roundId: r.id,
            available: inSet.has(r.id),
          },
          update: { available: inSet.has(r.id) },
        });
      }
    });

    const refreshed = await prisma.roundAvailability.findMany({
      where: { playerId: session.playerId },
    });

    return NextResponse.json(refreshed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
