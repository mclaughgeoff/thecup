import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

type PlayerEntry = { playerId: string; side: 'A' | 'B' };

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const roundId = request.nextUrl.searchParams.get('roundId');

    const matches = await prisma.match.findMany({
      where: roundId ? { roundId } : undefined,
      orderBy: [{ roundId: 'asc' }, { matchNumber: 'asc' }],
      include: {
        teamA: true,
        teamB: true,
        players: { include: { player: true } },
      },
    });

    return NextResponse.json(matches);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' ? 401 : message === 'Admin access required' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json() as {
      roundId?: string;
      matchNumber?: number;
      teamAId?: string;
      teamBId?: string;
      players?: PlayerEntry[];
    };

    if (!body.roundId || !body.teamAId || !body.teamBId || body.matchNumber == null) {
      return NextResponse.json(
        { error: 'roundId, matchNumber, teamAId, teamBId are required' },
        { status: 400 }
      );
    }

    const match = await prisma.match.create({
      data: {
        roundId: body.roundId,
        matchNumber: body.matchNumber,
        teamAId: body.teamAId,
        teamBId: body.teamBId,
        players: {
          create:
            body.players?.map((p) => ({
              playerId: p.playerId,
              side: p.side,
            })) ?? [],
        },
      },
      include: { players: { include: { player: true } }, teamA: true, teamB: true },
    });

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' ? 401 : message === 'Admin access required' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
