import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/admin/matches/[id]/override
 * Body: { pointsA: number | null, pointsB: number | null, label?: string | null, note?: string | null }
 *
 * Set or clear an admin result override. Passing nulls for pointsA/pointsB clears.
 * When set, overrides the computed scorecard both on the player-facing match page
 * and in tournament aggregation.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAdmin();
    const body = (await request.json()) as {
      pointsA?: number | null;
      pointsB?: number | null;
      label?: string | null;
      note?: string | null;
    };

    const clearing = body.pointsA == null || body.pointsB == null;
    if (clearing) {
      await prisma.match.update({
        where: { id: params.id },
        data: {
          overridePointsA: null,
          overridePointsB: null,
          overrideLabel: null,
          overrideNote: null,
          overriddenAt: null,
          overriddenById: null,
        },
      });
      return NextResponse.json({ success: true, cleared: true });
    }

    if (
      typeof body.pointsA !== 'number' ||
      typeof body.pointsB !== 'number' ||
      body.pointsA < 0 ||
      body.pointsB < 0
    ) {
      return NextResponse.json(
        { error: 'pointsA and pointsB must be non-negative numbers' },
        { status: 400 },
      );
    }

    const label = body.label?.trim() || null;
    const note = body.note?.trim() || null;
    if (label && label.length > 48) {
      return NextResponse.json({ error: 'label max 48 chars' }, { status: 400 });
    }
    if (note && note.length > 500) {
      return NextResponse.json({ error: 'note max 500 chars' }, { status: 400 });
    }

    await prisma.match.update({
      where: { id: params.id },
      data: {
        overridePointsA: body.pointsA,
        overridePointsB: body.pointsB,
        overrideLabel: label,
        overrideNote: note,
        overriddenAt: new Date(),
        overriddenById: session.playerId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status =
      msg === 'Unauthorized' ? 401 : msg === 'Admin access required' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

/**
 * DELETE /api/admin/matches/[id]/override — convenience clear.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();
    await prisma.match.update({
      where: { id: params.id },
      data: {
        overridePointsA: null,
        overridePointsB: null,
        overrideLabel: null,
        overrideNote: null,
        overriddenAt: null,
        overriddenById: null,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status =
      msg === 'Unauthorized' ? 401 : msg === 'Admin access required' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
