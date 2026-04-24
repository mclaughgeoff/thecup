import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

type PlayerEntry = { playerId: string; side: 'A' | 'B' };

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = (await request.json()) as {
      matchNumber?: number;
      teeSlotIndex?: number | null;
      players?: PlayerEntry[];
      result?: string | null;
      pointsA?: number | null;
      pointsB?: number | null;
      formatOverrideId?: string | null;
    };

    const data: Record<string, unknown> = {};
    if (body.matchNumber !== undefined)      data.matchNumber = body.matchNumber;
    if (body.teeSlotIndex !== undefined)     data.teeSlotIndex = body.teeSlotIndex;
    if (body.result !== undefined)           data.result = body.result || null;
    if (body.pointsA !== undefined)          data.pointsA = body.pointsA;
    if (body.pointsB !== undefined)          data.pointsB = body.pointsB;
    if (body.formatOverrideId !== undefined) data.formatOverrideId = body.formatOverrideId;

    const match = await prisma.$transaction(async (tx) => {
      const updated = await tx.match.update({
        where: { id: params.id },
        data,
      });

      if (body.players) {
        await tx.matchPlayer.deleteMany({ where: { matchId: params.id } });
        if (body.players.length > 0) {
          await tx.matchPlayer.createMany({
            data: body.players.map((p) => ({
              matchId: params.id,
              playerId: p.playerId,
              side: p.side,
            })),
          });
        }
      }

      return tx.match.findUniqueOrThrow({
        where: { id: updated.id },
        include: { players: { include: { player: true } }, teamA: true, teamB: true },
      });
    });

    return NextResponse.json(match);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' ? 401 : message === 'Admin access required' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await prisma.match.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' ? 401 : message === 'Admin access required' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
