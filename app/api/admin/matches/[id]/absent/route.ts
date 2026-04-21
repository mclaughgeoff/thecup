import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/matches/[id]/absent
 * Body: { playerId: string, absentOverride: boolean | null }
 *
 * Three-state absence override on a MatchPlayer row:
 *   true  → force Absent
 *   false → force Present (overrides a stale unavailable flag)
 *   null  → revert to Auto (inherit from RoundAvailability)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();
    const body = (await request.json()) as {
      playerId?: string;
      absentOverride?: boolean | null;
    };
    if (!body.playerId) {
      return NextResponse.json({ error: 'playerId required' }, { status: 400 });
    }
    if (body.absentOverride !== null && typeof body.absentOverride !== 'boolean') {
      return NextResponse.json(
        { error: 'absentOverride must be true, false, or null' },
        { status: 400 },
      );
    }

    const updated = await prisma.matchPlayer.updateMany({
      where: { matchId: params.id, playerId: body.playerId },
      data: { absentOverride: body.absentOverride ?? null },
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { error: 'Player is not in this match' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status =
      msg === 'Unauthorized' ? 401 : msg === 'Admin access required' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
