import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  computeMatchState,
  resolveAbsence,
  resolveRoundFormat,
  type GhostDifficulty,
  type HoleInfo,
  type PlayerInfo,
  type ScoreRow,
  type Side,
} from '@/lib/scoring';

export const dynamic = 'force-dynamic';

/**
 * GET /api/scoring/match/[matchId]
 * Returns the computed MatchState plus match metadata (teams, players, format),
 * absent-player resolution, ghost scorecards, and admin override (if any).
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
        overriddenBy: { select: { id: true, name: true, nickname: true } },
        round: {
          include: {
            formatRef: true,
            handicapOverrides: true,
            availabilities: true,
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

    const holes: HoleInfo[] = (match.round.courseRef?.holes ?? []).map(h => ({
      holeNumber: h.holeNumber,
      par: h.par,
      handicapIndex: h.handicapIndex,
    }));

    const activeTeeBoxName = match.round.activeTeeBox;
    const teeBox = match.round.courseRef?.teeBoxes?.find(t => t.name === activeTeeBoxName) ?? null;
    const slope = teeBox?.slope ?? null;

    // Resolve absence state per MatchPlayer using availability + absentOverride.
    const availabilityByPlayer = new Map<string, { available: boolean }>();
    for (const a of match.round.availabilities ?? []) {
      availabilityByPlayer.set(a.playerId, { available: a.available });
    }

    const absentInfo = match.players.map(mp => {
      const { absent, source } = resolveAbsence(
        mp.absentOverride,
        availabilityByPlayer.get(mp.playerId),
      );
      return { playerId: mp.playerId, absent, source, absentOverride: mp.absentOverride };
    });
    const absentById = new Map(absentInfo.map(a => [a.playerId, a]));

    const players: PlayerInfo[] = match.players.map(mp => {
      const info = absentById.get(mp.playerId)!;
      return {
        playerId: mp.playerId,
        name: mp.player.name,
        handicap: mp.player.handicap,
        side: mp.side as Side,
        absent: info.absent,
        absenceSource: info.source,
      };
    });

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

    const ghostDifficulty = (match.ghostDifficulty ?? 'AUTO') as GhostDifficulty;

    const state = computeMatchState({
      playerOverrides,
      format: resolved.format,
      allowance: resolved.allowance,
      slope,
      holes,
      players,
      scores,
      ghostDifficulty,
    });

    const hasOverride = match.overridePointsA != null && match.overridePointsB != null;
    const override = hasOverride
      ? {
          pointsA: match.overridePointsA,
          pointsB: match.overridePointsB,
          label: match.overrideLabel,
          note: match.overrideNote,
          overriddenAt: match.overriddenAt,
          overriddenBy: match.overriddenBy
            ? {
                id: match.overriddenBy.id,
                name: match.overriddenBy.nickname || match.overriddenBy.name,
              }
            : null,
        }
      : null;

    return NextResponse.json({
      match: {
        id: match.id,
        matchNumber: match.matchNumber,
        result: match.result,
        pointsA: match.pointsA,
        pointsB: match.pointsB,
        ghostDifficulty,
        override,
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
      absentPlayers: absentInfo
        .filter(a => a.absent)
        .map(a => ({ playerId: a.playerId, source: a.source })),
      absenceByPlayer: absentInfo.reduce<Record<string, { absent: boolean; source: string; absentOverride: boolean | null }>>(
        (acc, a) => {
          acc[a.playerId] = { absent: a.absent, source: a.source, absentOverride: a.absentOverride ?? null };
          return acc;
        }, {}),
      state,
    });
  } catch (error) {
    const m = error instanceof Error ? error.message : 'Internal server error';
    const status = m === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: m }, { status });
  }
}
