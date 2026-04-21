import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  computeMatchState,
  resolveRoundFormat,
  type HoleInfo,
  type PlayerInfo,
  type ScoreRow,
  type Side,
} from '@/lib/scoring';

export const dynamic = 'force-dynamic';

/**
 * GET /api/scoring/match/[matchId]
 * Returns the computed MatchState plus match metadata (teams, players, format).
 */
export async function GET(
  _request: Request,
  { params }: { params: { matchId: string } }
) {
  try {
    await requireAuth();

    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      include: {
        teamA: true,
        teamB: true,
        players: { include: { player: true } },
        scores: true,
        round: {
          include: {
            formatRef: true,
            handicapOverrides: true,
            courseRef: {
              include: {
                teeBoxes: true,
                holes: { orderBy: { holeNumber: 'asc' } },
              },
            },
          },
        },
      },
    });
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const resolved = resolveRoundFormat(match.round);
    if (!resolved) {
      return NextResponse.json(
        { error: 'Round has no linked format. Set one in Admin → Rounds.' },
        { status: 400 }
      );
    }

    // Build scoring-engine input
    const holes: HoleInfo[] = (match.round.courseRef?.holes ?? []).map(h => ({
      holeNumber: h.holeNumber,
      par: h.par,
      handicapIndex: h.handicapIndex,
    }));

    const activeTeeBoxName = match.round.activeTeeBox;
    const teeBox = match.round.courseRef?.teeBoxes?.find(t => t.name === activeTeeBoxName) ?? null;
    const slope = teeBox?.slope ?? null;

    const players: PlayerInfo[] = match.players.map(mp => ({
      playerId: mp.playerId,
      name: mp.player.name,
      handicap: mp.player.handicap,
      side: mp.side as Side,
    }));

    const scores: ScoreRow[] = match.scores.map(s => ({
      hole: s.hole,
      side: s.side as Side,
      playerId: s.playerId,
      strokes: s.strokes,
    }));

    const playerOverrides: Record<string, number> = {};
    for (const o of match.round.handicapOverrides ?? []) {
      playerOverrides[o.playerId] = o.playingHandicap;
    }

    const state = computeMatchState({
      playerOverrides,
      format: resolved.format,
      allowance: resolved.allowance,
      slope,
      holes,
      players,
      scores,
    });

    return NextResponse.json({
      match: {
        id: match.id,
        matchNumber: match.matchNumber,
        result: match.result,
        pointsA: match.pointsA,
        pointsB: match.pointsB,
        teamA: { id: match.teamA.id, name: match.teamA.name, color: match.teamA.color },
        teamB: { id: match.teamB.id, name: match.teamB.name, color: match.teamB.color },
      },
      round: {
        id: match.round.id,
        roundNumber: match.round.roundNumber,
        dayOfWeek: match.round.dayOfWeek,
        course: match.round.course,
        teeTime: match.round.teeSlots?.[match.teeSlotIndex ?? 0] ?? match.round.teeTime,
        activeTeeBox: match.round.activeTeeBox,
        course_name: match.round.courseRef?.name ?? match.round.course,
      },
      format: {
        name: match.round.formatRef?.name ?? match.round.format,
        slug: match.round.formatRef?.slug ?? null,
        ...resolved.format,
      },
      allowance: resolved.allowance,
      slope,
      holes,
      state,
    });
  } catch (error) {
    const m = error instanceof Error ? error.message : 'Internal server error';
    const status = m === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: m }, { status });
  }
}
