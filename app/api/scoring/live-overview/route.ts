import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  computeMatchState,
  computeRyderCupTotals,
  projectMatchPoints,
  resolveRoundFormat,
  type HoleInfo,
  type PlayerInfo,
  type ScoreRow,
  type Side,
  type ScoringType,
  type MatchState,
} from '@/lib/scoring';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAuth();

    const [teams, matches] = await Promise.all([
      prisma.ryderCupTeam.findMany({ orderBy: { teamNumber: 'asc' } }),
      prisma.match.findMany({
        orderBy: [{ round: { date: 'asc' } }, { matchNumber: 'asc' }],
        include: {
          teamA: true,
          teamB: true,
          scores: true,
          players: { include: { player: true } },
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
      }),
    ]);

    const teamByNumber = {
      1: teams.find((t) => t.teamNumber === 1),
      2: teams.find((t) => t.teamNumber === 2),
    } as const;

    const aggregateInput: Array<{
      state: MatchState;
      scoringType: ScoringType;
      pointsA: number | null;
      pointsB: number | null;
    }> = [];

    const rows = matches.map((m) => {
      const resolved = resolveRoundFormat(m.round);
      if (!resolved || !m.round.courseRef) {
        return null;
      }
      const holes: HoleInfo[] = m.round.courseRef.holes.map((h) => ({
        holeNumber: h.holeNumber,
        par: h.par,
        handicapIndex: h.handicapIndex,
      }));
      const slope =
        m.round.courseRef.teeBoxes.find((t) => t.name === m.round.activeTeeBox)?.slope ?? null;
      const players: PlayerInfo[] = m.players.map((mp) => ({
        playerId: mp.playerId,
        name: mp.player.name,
        handicap: mp.player.handicap,
        side: mp.side as Side,
      }));
      const scoreRows: ScoreRow[] = m.scores.map((s) => ({
        hole: s.hole,
        side: s.side as Side,
        playerId: s.playerId,
        strokes: s.strokes,
      }));
      const playerOverrides: Record<string, number> = {};
      for (const o of m.round.handicapOverrides ?? []) {
        playerOverrides[o.playerId] = o.playingHandicap;
      }
      const state = computeMatchState({
        format: resolved.format,
        allowance: resolved.allowance,
        slope,
        holes,
        players,
        scores: scoreRows,
        playerOverrides,
      });
      const scoringType = resolved.format.scoringType;
      aggregateInput.push({
        state,
        scoringType,
        pointsA: m.pointsA,
        pointsB: m.pointsB,
      });
      const isFinal = state.matchStatus.final || (m.pointsA != null && m.pointsB != null);
      const projected = projectMatchPoints(state, { final: isFinal }, scoringType);
      const teeTime = m.round.teeSlots?.[m.teeSlotIndex ?? 0] ?? m.round.teeTime;
      return {
        id: m.id,
        roundId: m.round.id,
        roundNumber: m.round.roundNumber,
        roundLabel: `${m.round.dayOfWeek} · ${m.round.course}`,
        teeTime,
        matchNumber: m.matchNumber,
        sideA: {
          label: m.teamA.name,
          color: m.teamA.color ?? '#C41E3A',
          players: players.filter((p) => p.side === 'A').map((p) => p.name),
        },
        sideB: {
          label: m.teamB.name,
          color: m.teamB.color ?? '#003DA5',
          players: players.filter((p) => p.side === 'B').map((p) => p.name),
        },
        status: state.matchStatus.label,
        thru: state.matchStatus.thru,
        upBy: state.matchStatus.upBy,
        final: isFinal,
        points: {
          a: m.pointsA ?? (isFinal ? state.points.a ?? 0 : 0),
          b: m.pointsB ?? (isFinal ? state.points.b ?? 0 : 0),
        },
        projected,
      };
    });

    const filtered = rows.filter((r): r is NonNullable<typeof r> => r !== null);
    const totals = computeRyderCupTotals(aggregateInput);

    return NextResponse.json(
      {
        teams: {
          1: teamByNumber[1]
            ? { id: teamByNumber[1]!.id, name: teamByNumber[1]!.name, color: teamByNumber[1]!.color ?? '#C41E3A' }
            : null,
          2: teamByNumber[2]
            ? { id: teamByNumber[2]!.id, name: teamByNumber[2]!.name, color: teamByNumber[2]!.color ?? '#003DA5' }
            : null,
        },
        actual: totals.actual,
        projected: totals.projected,
        matches: filtered,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status = msg === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
