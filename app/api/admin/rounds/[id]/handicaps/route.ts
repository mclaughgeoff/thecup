import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  courseHandicap,
  playingHandicap,
  resolveRoundFormat,
} from '@/lib/scoring';

export const dynamic = 'force-dynamic';

function authStatus(msg: string) {
  if (msg === 'Unauthorized') return 401;
  if (msg === 'Admin access required') return 403;
  return 500;
}

/**
 * GET /api/admin/rounds/[id]/handicaps
 * Returns:
 *   - round: { id, roundNumber, formatName, allowance, slope }
 *   - players: [{ id, name, handicap, computedPH, overridePH: number | null }]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const round = await prisma.round.findUnique({
      where: { id: params.id },
      include: {
        formatRef: true,
        courseRef: { include: { teeBoxes: true } },
        handicapOverrides: true,
      },
    });
    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    const resolved = resolveRoundFormat(round);
    const allowance = resolved?.allowance ?? null;
    const slope =
      round.courseRef?.teeBoxes.find((t) => t.name === round.activeTeeBox)?.slope ?? null;

    const players = await prisma.player.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, handicap: true, photoUrl: true },
    });

    const overrideMap = new Map(
      round.handicapOverrides.map((o) => [o.playerId, o.playingHandicap]),
    );

    const rows = players.map((p) => {
      const ch = courseHandicap(p.handicap, slope);
      const computedPH = allowance != null ? playingHandicap(ch, allowance) : null;
      const overridePH = overrideMap.get(p.id) ?? null;
      return {
        id: p.id,
        name: p.name,
        photoUrl: p.photoUrl,
        handicap: p.handicap,
        courseHandicap: ch,
        computedPH,
        overridePH,
      };
    });

    return NextResponse.json({
      round: {
        id: round.id,
        roundNumber: round.roundNumber,
        dayOfWeek: round.dayOfWeek,
        course: round.course,
        teeTime: round.teeTime,
        formatName: round.formatRef?.name ?? round.format,
        allowance,
        slope,
        activeTeeBox: round.activeTeeBox,
      },
      players: rows,
    });
  } catch (error) {
    const m = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: m }, { status: authStatus(m) });
  }
}

/**
 * PUT /api/admin/rounds/[id]/handicaps
 * Body: { overrides: [{ playerId, playingHandicap: number | null }] }
 * - Number → upsert row
 * - null → delete override (revert to computed)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = (await request.json()) as {
      overrides?: Array<{ playerId: string; playingHandicap: number | null }>;
    };
    if (!Array.isArray(body.overrides)) {
      return NextResponse.json({ error: 'overrides must be an array' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      for (const o of body.overrides!) {
        if (!o.playerId) continue;
        if (o.playingHandicap === null || o.playingHandicap === undefined) {
          await tx.roundPlayerHandicap.deleteMany({
            where: { roundId: params.id, playerId: o.playerId },
          });
          continue;
        }
        const ph = Number(o.playingHandicap);
        if (!Number.isFinite(ph) || ph < 0 || ph > 72) continue;
        await tx.roundPlayerHandicap.upsert({
          where: { roundId_playerId: { roundId: params.id, playerId: o.playerId } },
          create: { roundId: params.id, playerId: o.playerId, playingHandicap: ph },
          update: { playingHandicap: ph },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const m = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: m }, { status: authStatus(m) });
  }
}
