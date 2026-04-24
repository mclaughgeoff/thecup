import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function authStatus(msg: string) {
  if (msg === 'Unauthorized') return 401;
  return 500;
}

/**
 * Upsert a score for a hole.
 *
 * Body:
 *   { side: 'A' | 'B', strokes: number, playerId?: string | null }
 *
 * - For `per_player` formats: include playerId so we record which player's score it is.
 *   (Uniqueness: [matchId, playerId, hole].)
 * - For `per_side` formats: omit playerId so the record is team-level.
 *   (Uniqueness: [matchId, side, hole] via null playerId slot.)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string; hole: string } }
) {
  try {
    const session = await requireAuth();

    const hole = parseInt(params.hole, 10);
    if (Number.isNaN(hole) || hole < 1 || hole > 18) {
      return NextResponse.json({ error: 'Invalid hole number' }, { status: 400 });
    }

    const body = await request.json() as {
      side?: 'A' | 'B';
      strokes?: number;
      playerId?: string | null;
    };

    if (body.side !== 'A' && body.side !== 'B') {
      return NextResponse.json({ error: 'side must be A or B' }, { status: 400 });
    }
    const strokes = Number(body.strokes);
    if (!Number.isFinite(strokes) || strokes < 1 || strokes > 25) {
      return NextResponse.json({ error: 'strokes must be 1–25' }, { status: 400 });
    }
    const playerId = body.playerId ?? null;

    // Verify the match exists and, if playerId given, they're actually on that side.
    const [match, viewer] = await Promise.all([
      prisma.match.findUnique({
        where: { id: params.matchId },
        include: { players: true },
      }),
      prisma.player.findUnique({ where: { id: session.playerId } }),
    ]);
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

    // Only admins — or players on the same side — can enter a score.
    const viewerMp = match.players.find((p) => p.playerId === session.playerId);
    const viewerSide = viewerMp?.side ?? null;
    if (!viewer?.isAdmin && viewerSide !== body.side) {
      return NextResponse.json(
        { error: 'You can only enter scores for your own team' },
        { status: 403 },
      );
    }

    if (playerId) {
      const mp = match.players.find(p => p.playerId === playerId);
      if (!mp) {
        return NextResponse.json({ error: 'Player is not in this match' }, { status: 400 });
      }
      if (mp.side !== body.side) {
        return NextResponse.json({ error: 'Player side mismatch' }, { status: 400 });
      }
    }

    // Upsert manually — Prisma unique constraints don't play well with nullable columns in upsert,
    // so find-then-update|create by (matchId, playerId, hole) OR (matchId, side, hole when playerId null).
    let score;
    if (playerId) {
      const existing = await prisma.score.findFirst({
        where: { matchId: params.matchId, playerId, hole },
      });
      if (existing) {
        score = await prisma.score.update({
          where: { id: existing.id },
          data: { strokes, side: body.side },
        });
      } else {
        score = await prisma.score.create({
          data: { matchId: params.matchId, playerId, side: body.side, hole, strokes },
        });
      }
    } else {
      const existing = await prisma.score.findFirst({
        where: { matchId: params.matchId, side: body.side, hole, playerId: null },
      });
      if (existing) {
        score = await prisma.score.update({
          where: { id: existing.id },
          data: { strokes },
        });
      } else {
        score = await prisma.score.create({
          data: { matchId: params.matchId, playerId: null, side: body.side, hole, strokes },
        });
      }
    }

    return NextResponse.json(score);
  } catch (error) {
    const m = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: m }, { status: authStatus(m) });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { matchId: string; hole: string } }
) {
  try {
    const session = await requireAuth();
    const hole = parseInt(params.hole, 10);
    const body = await request.json().catch(() => ({})) as {
      side?: 'A' | 'B';
      playerId?: string | null;
    };

    const [match, viewer] = await Promise.all([
      prisma.match.findUnique({
        where: { id: params.matchId },
        include: { players: true },
      }),
      prisma.player.findUnique({ where: { id: session.playerId } }),
    ]);
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

    const viewerSide = match.players.find((p) => p.playerId === session.playerId)?.side ?? null;
    if (!viewer?.isAdmin && body.side && viewerSide !== body.side) {
      return NextResponse.json(
        { error: 'You can only clear scores for your own team' },
        { status: 403 },
      );
    }

    if (body.playerId) {
      await prisma.score.deleteMany({
        where: { matchId: params.matchId, playerId: body.playerId, hole },
      });
    } else if (body.side) {
      await prisma.score.deleteMany({
        where: { matchId: params.matchId, side: body.side, hole, playerId: null },
      });
    } else {
      return NextResponse.json({ error: 'Specify playerId or side' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const m = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: m }, { status: authStatus(m) });
  }
}
