import { requireAuth } from '@/lib/auth';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import SessionLeaderboardCard, { type SessionStatus } from '@/components/SessionLeaderboardCard';
import MatchLeaderboardRow from '@/components/MatchLeaderboardRow';
import { ArrowRightIcon, UsersIcon } from '@/components/icons';
import { prisma } from '@/lib/db';
import {
  computeMatchState,
  resolveAbsence,
  resolveRoundFormat,
  type GhostDifficulty,
  type HoleInfo,
  type MatchState,
  type PlayerInfo,
  type ScoreRow,
  type Side,
} from '@/lib/scoring';
import { fmtPts, isWithinTeeTimeWindow } from '@/lib/utils';
import Link from 'next/link';
import clsx from 'clsx';

export const dynamic = 'force-dynamic';

type MatchComputed = {
  matchId: string;
  matchNumber: number;
  teeTime: string | null;
  /** Format override label, only set if differs from round format. */
  overrideFormatLabel: string | null;
  sideA: { label: string; color: string; players: Array<{ name: string; absent: boolean }> };
  sideB: { label: string; color: string; players: Array<{ name: string; absent: boolean }> };
  pointsA: number | null;
  pointsB: number | null;
  final: boolean;
  hasAnyScores: boolean;
  statusLabel: string;
  /** Match-play live leader: positive = A is up, negative = B is up. Null for non-match formats / no state. */
  upBy: number | null;
};

export default async function RyderCupPage() {
  const session = await requireAuth();
  const player = await prisma.player.findUnique({ where: { id: session.playerId } });

  const [teams, rcRounds] = await Promise.all([
    prisma.ryderCupTeam.findMany({ orderBy: { teamNumber: 'asc' } }),
    prisma.round.findMany({
      where: { isRyderCup: true },
      orderBy: { date: 'asc' },
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
        matches: {
          orderBy: { matchNumber: 'asc' },
          include: {
            teamA: true,
            teamB: true,
            scores: true,
            formatOverride: true,
            players: { include: { player: true } },
          },
        },
      },
    }),
  ]);

  const teamA = teams[0];
  const teamB = teams[1];
  const teamAColor = teamA?.color ?? '#C41E3A';
  const teamBColor = teamB?.color ?? '#003DA5';

  // Compute per-match state and per-session aggregates. Iterate sessions in
  // date order so running totals are correct.
  let cumulativeA = 0;
  let cumulativeB = 0;

  const sessions = rcRounds.map((round) => {
    const roundFormatRef = round.formatRef;
    const computed: MatchComputed[] = round.matches.map((m) => {
      const effectiveFormatRef = m.formatOverride ?? roundFormatRef;
      const overrideLabel =
        m.formatOverride && m.formatOverride.id !== roundFormatRef?.id
          ? m.formatOverride.name
          : null;

      const resolved = resolveRoundFormat({
        handicapAllowance: round.handicapAllowance,
        scoringType: round.scoringType,
        formatRef: effectiveFormatRef,
      });

      const holes: HoleInfo[] = (round.courseRef?.holes ?? []).map((h) => ({
        holeNumber: h.holeNumber,
        par: h.par,
        handicapIndex: h.handicapIndex,
      }));
      const slope =
        round.courseRef?.teeBoxes.find((t) => t.name === round.activeTeeBox)?.slope ?? null;

      const availabilityByPlayer = new Map<string, { available: boolean }>();
      for (const a of round.availabilities ?? []) {
        availabilityByPlayer.set(a.playerId, { available: a.available });
      }
      const players: PlayerInfo[] = m.players.map((mp) => {
        const { absent, source } = resolveAbsence(
          mp.absentOverride,
          availabilityByPlayer.get(mp.playerId),
        );
        return {
          playerId: mp.playerId,
          name: mp.player.name,
          handicap: mp.player.handicap,
          side: mp.side as Side,
          absent,
          absenceSource: source,
        };
      });

      let state: MatchState | null = null;
      if (resolved && round.courseRef) {
        const scores: ScoreRow[] = m.scores.map((s) => ({
          hole: s.hole,
          side: s.side as Side,
          playerId: s.playerId,
          strokes: s.strokes,
        }));
        const playerOverrides: Record<string, number> = {};
        for (const o of round.handicapOverrides ?? []) {
          playerOverrides[o.playerId] = o.playingHandicap;
        }
        state = computeMatchState({
          format: resolved.format,
          allowance: resolved.allowance,
          slope,
          holes,
          players,
          scores,
          playerOverrides,
          ghostDifficulty: (m.ghostDifficulty ?? 'AUTO') as GhostDifficulty,
        });
      }

      const hasOverride = m.overridePointsA != null && m.overridePointsB != null;
      const isFinal =
        hasOverride ||
        (state?.matchStatus.final ?? false) ||
        (m.pointsA != null && m.pointsB != null);

      const actualA = hasOverride
        ? (m.overridePointsA as number)
        : m.pointsA ?? (isFinal ? state?.points.a ?? 0 : null);
      const actualB = hasOverride
        ? (m.overridePointsB as number)
        : m.pointsB ?? (isFinal ? state?.points.b ?? 0 : null);

      const statusLabel = hasOverride
        ? m.overrideLabel || 'Admin call'
        : state?.matchStatus.label ?? 'Upcoming';

      const hasAnyScores = m.scores.length > 0;
      const teeTime = round.teeSlots?.[m.teeSlotIndex ?? 0] ?? round.teeTime;

      return {
        matchId: m.id,
        matchNumber: m.matchNumber,
        teeTime,
        overrideFormatLabel: overrideLabel,
        sideA: {
          label: m.teamA.name,
          color: m.teamA.color ?? teamAColor,
          players: players
            .filter((p) => p.side === 'A')
            .map((p) => ({ name: p.name, absent: p.absent === true })),
        },
        sideB: {
          label: m.teamB.name,
          color: m.teamB.color ?? teamBColor,
          players: players
            .filter((p) => p.side === 'B')
            .map((p) => ({ name: p.name, absent: p.absent === true })),
        },
        pointsA: actualA,
        pointsB: actualB,
        final: isFinal,
        hasAnyScores,
        statusLabel,
        upBy: state?.matchStatus.upBy ?? null,
      } satisfies MatchComputed;
    });

    // Session-level aggregates: only count matches that have awarded (or override) points.
    let sessionA = 0;
    let sessionB = 0;
    let hasAwardedPoints = false;
    let allFinal = computed.length > 0;
    let anyInProgress = false;
    for (const c of computed) {
      if (c.final && c.pointsA != null && c.pointsB != null) {
        sessionA += c.pointsA;
        sessionB += c.pointsB;
        hasAwardedPoints = true;
      } else {
        allFinal = false;
        if (c.hasAnyScores) anyInProgress = true;
      }
    }

    // Only flag a session "Live" once we're within 30 minutes of its earliest
    // tee time (or past it). A pre-entered score on an upcoming day shouldn't
    // turn the whole session green.
    const earliestTee = round.teeSlots?.[0] ?? round.teeTime ?? null;
    const withinWindow = isWithinTeeTimeWindow(round.date, earliestTee);

    const status: SessionStatus =
      computed.length === 0
        ? 'upcoming'
        : allFinal
          ? 'final'
          : anyInProgress && withinWindow
            ? 'live'
            : 'upcoming';

    cumulativeA += sessionA;
    cumulativeB += sessionB;

    return {
      id: round.id,
      roundNumber: round.roundNumber,
      dayOfWeek: round.dayOfWeek,
      course: round.course,
      format: round.formatRef?.name ?? round.format,
      status,
      sessionPointsA: hasAwardedPoints ? sessionA : null,
      sessionPointsB: hasAwardedPoints ? sessionB : null,
      cumulativeA,
      cumulativeB,
      matches: computed,
    };
  });

  const finalSessions = sessions.filter((s) => s.status === 'final').length;
  const totalSessions = sessions.length;
  const cupA = cumulativeA;
  const cupB = cumulativeB;

  // Progress segments: one per RC round, colored by who won (or in-progress / upcoming).
  const progressSegments = sessions.map((s) => {
    if (s.status === 'final' && s.sessionPointsA != null && s.sessionPointsB != null) {
      if (s.sessionPointsA > s.sessionPointsB) return { kind: 'A' as const, color: teamAColor };
      if (s.sessionPointsB > s.sessionPointsA) return { kind: 'B' as const, color: teamBColor };
      return { kind: 'draw' as const, color: '#9CA3AF' };
    }
    if (s.status === 'live') return { kind: 'live' as const, color: '#10B981' };
    return { kind: 'upcoming' as const, color: '#E5E7EB' };
  });

  return (
    <>
      <AppHeader title="Ryder Cup" />
      <main className="bg-ink-0 pb-nav">
        {/* Scoreboard hero — extends the dark-green band downward from the header */}
        <section className="bg-hero-green text-cream relative">
          <div className="px-4 pt-6 pb-7">
            <p className="text-[10px] uppercase tracking-[0.3em] text-cream/70 text-center mb-5">
              Cup total
            </p>

            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
              <ScoreboardSide
                color={teamAColor}
                name={teamA?.name ?? 'Team A'}
                value={cupA}
              />
              <span className="text-cream/50 text-2xl font-light pb-3">–</span>
              <ScoreboardSide
                color={teamBColor}
                name={teamB?.name ?? 'Team B'}
                value={cupB}
              />
            </div>

            {/* Progress segments */}
            <div className="mt-6">
              <div
                className="flex gap-1"
                role="img"
                aria-label={`${finalSessions} of ${totalSessions} sessions played`}
              >
                {progressSegments.map((seg, i) => (
                  <span
                    key={i}
                    className={clsx(
                      'flex-1 h-1.5 rounded-full transition-colors',
                      seg.kind === 'live' && 'animate-pulse-dot',
                    )}
                    style={{ backgroundColor: seg.color }}
                  />
                ))}
              </div>
              <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-cream/70 text-center">
                {finalSessions}/{totalSessions} sessions played
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 pt-4">
          <Link
            href="/ryder-cup/teams"
            className="card flex items-center justify-between hover:border-fg-3 transition tap-highlight-none"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-ink-2 border border-ink-3 flex items-center justify-center text-fg-2">
                <UsersIcon size={16} />
              </span>
              <div>
                <p className="font-semibold text-sm">Team rosters</p>
                <p className="text-xs text-fg-3">See who's on each side</p>
              </div>
            </div>
            <ArrowRightIcon size={18} className="text-fg-3" />
          </Link>
        </section>

        {/* Sessions */}
        <section className="px-4 pt-6">
          <h2 className="label mb-3">Sessions</h2>
          <div className="space-y-3">
            {sessions.map((s) => (
              <SessionLeaderboardCard
                key={s.id}
                roundNumber={s.roundNumber}
                dayOfWeek={s.dayOfWeek}
                course={s.course}
                format={s.format}
                status={s.status}
                sessionPointsA={s.sessionPointsA}
                sessionPointsB={s.sessionPointsB}
                cumulativeA={s.cumulativeA}
                cumulativeB={s.cumulativeB}
                teamAColor={teamAColor}
                teamBColor={teamBColor}
                defaultOpen={s.status === 'live'}
              >
                {s.matches.length === 0 ? (
                  <p className="text-sm text-fg-3 italic pt-3">Pairings TBD</p>
                ) : (
                  <div className="space-y-2 pt-3">
                    {s.matches.map((m) => (
                      <Link
                        key={m.matchId}
                        href={`/ryder-cup/match/${m.matchId}`}
                        className="block hover:opacity-90 transition tap-highlight-none"
                      >
                        <MatchLeaderboardRow
                          matchNumber={m.matchNumber}
                          teeTime={m.teeTime}
                          formatLabel={m.overrideFormatLabel}
                          upBy={m.upBy}
                          sideA={m.sideA}
                          sideB={m.sideB}
                          pointsA={m.pointsA}
                          pointsB={m.pointsB}
                          final={m.final}
                          statusLabel={m.statusLabel}
                        />
                      </Link>
                    ))}
                  </div>
                )}
              </SessionLeaderboardCard>
            ))}
          </div>
        </section>
      </main>
      <BottomTabBar isAdmin={player?.isAdmin} />
    </>
  );
}

function ScoreboardSide({
  color,
  name,
  value,
}: {
  color: string;
  name: string;
  value: number;
}) {
  return (
    <div className="text-center min-w-0">
      {/* Thick team color bar */}
      <span
        aria-hidden="true"
        className="block h-2 w-14 rounded-full mx-auto mb-3"
        style={{ backgroundColor: color }}
      />
      <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-cream/80 truncate">
        {name}
      </p>
      <p className="mt-2 text-[56px] leading-none font-mono font-extrabold tabular-nums text-cream">
        {fmtPts(value)}
      </p>
    </div>
  );
}
