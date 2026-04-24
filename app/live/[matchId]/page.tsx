import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import {
  computeMatchState,
  resolveRoundFormat,
  type HoleInfo,
  type PlayerInfo,
  type ScoreRow,
  type Side,
} from '@/lib/scoring';
import LiveZone from '@/components/live/LiveZone';
import type { MatchStateResp } from '@/components/live/HoleScoring';

export const dynamic = 'force-dynamic';

export default async function LiveMatchPage({
  params,
}: {
  params: { matchId: string };
}) {
  const session = await requireAuth();

  const [match, viewer] = await Promise.all([
    prisma.match.findUnique({
      where: { id: params.matchId },
      include: {
        teamA: true,
        teamB: true,
        scores: true,
        formatOverride: true,
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
    prisma.player.findUnique({ where: { id: session.playerId } }),
  ]);

  if (!match) notFound();

  // Prefer the match-level format override when an admin has set one.
  const effectiveFormatRef = match.formatOverride ?? match.round.formatRef;
  const resolved = resolveRoundFormat({
    handicapAllowance: match.round.handicapAllowance,
    scoringType: match.round.scoringType,
    formatRef: effectiveFormatRef,
  });
  if (!resolved) {
    // No scoring format — live zone isn't useful yet. Bounce back to the classic match page.
    redirect(`/ryder-cup/match/${match.id}`);
  }

  const viewerMatchPlayer = match.players.find((p) => p.playerId === session.playerId);
  const viewerSide: 'A' | 'B' | null = (viewerMatchPlayer?.side as 'A' | 'B' | undefined) ?? null;

  const holes: HoleInfo[] = (match.round.courseRef?.holes ?? []).map((h) => ({
    holeNumber: h.holeNumber,
    par: h.par,
    handicapIndex: h.handicapIndex,
  }));
  const slope =
    match.round.courseRef?.teeBoxes.find((t) => t.name === match.round.activeTeeBox)?.slope ?? null;
  const playerInfos: PlayerInfo[] = match.players.map((mp) => ({
    playerId: mp.playerId,
    name: mp.player.name,
    handicap: mp.player.handicap,
    side: mp.side as Side,
  }));
  const scoreRows: ScoreRow[] = match.scores.map((s) => ({
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
    format: resolved.format,
    allowance: resolved.allowance,
    slope,
    holes,
    players: playerInfos,
    scores: scoreRows,
    playerOverrides,
  });

  const initialData: MatchStateResp = {
    match: {
      id: match.id,
      matchNumber: match.matchNumber,
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
      name: effectiveFormatRef?.name ?? match.round.format,
      slug: effectiveFormatRef?.slug ?? null,
      scoringType: resolved.format.scoringType,
      teamScoringMode: resolved.format.teamScoringMode,
      strokeEntryMode: resolved.format.strokeEntryMode,
    },
    allowance: resolved.allowance,
    holes,
    state: {
      perPlayer: state.perPlayer.map((p) => ({
        playerId: p.playerId,
        name: p.name,
        side: p.side,
        handicap: p.handicap,
        playingHandicap: p.playingHandicap,
        strokesByHole: p.strokesByHole,
      })),
      teamStrokesByHole: state.teamStrokesByHole,
      perHole: state.perHole.map((h) => ({
        hole: h.hole,
        grossA: h.grossA,
        grossB: h.grossB,
        netA: h.netA,
        netB: h.netB,
        strokesA: h.strokesA,
        strokesB: h.strokesB,
      })),
      matchStatus: { label: state.matchStatus.label, final: state.matchStatus.final },
    },
  };

  return (
    <LiveZone
      matchId={match.id}
      initialData={initialData}
      viewer={{
        playerId: session.playerId,
        side: viewerSide,
        isAdmin: viewer?.isAdmin ?? false,
      }}
    />
  );
}
