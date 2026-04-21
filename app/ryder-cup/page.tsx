import { requireAuth } from '@/lib/auth';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import SectionCard from '@/components/SectionCard';
import { ArrowRightIcon, UsersIcon } from '@/components/icons';
import { prisma } from '@/lib/db';
import {
  computeMatchState,
  resolveRoundFormat,
  type HoleInfo,
  type PlayerInfo,
  type ScoreRow,
  type Side,
} from '@/lib/scoring';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type LiveMatchResult = {
  matchId: string;
  teamAId: string;
  teamBId: string;
  pointsA: number;       // running/final live points
  pointsB: number;
  final: boolean;        // match mathematically closed
  label: string;         // "2 UP thru 12", "3&2", "AS", etc.
};

export default async function RyderCupPage() {
  const session = await requireAuth();
  const player = await prisma.player.findUnique({ where: { id: session.playerId } });

  const teams = await prisma.ryderCupTeam.findMany({
    orderBy: { teamNumber: 'asc' },
    include: { members: true },
  });

  // Pull every match with everything needed to compute state in one go.
  const matches = await prisma.match.findMany({
    include: {
      teamA: true,
      teamB: true,
      scores: true,
      players: { include: { player: true } },
      round: {
        include: {
          formatRef: true,
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

  // Compute live state per match
  const liveResults: LiveMatchResult[] = [];
  for (const m of matches) {
    const resolved = resolveRoundFormat(m.round);
    if (!resolved || !m.round.courseRef) {
      liveResults.push({
        matchId: m.id, teamAId: m.teamAId, teamBId: m.teamBId,
        pointsA: m.pointsA ?? 0, pointsB: m.pointsB ?? 0,
        final: m.pointsA != null && m.pointsB != null,
        label: m.result ?? 'Unconfigured',
      });
      continue;
    }
    const holes: HoleInfo[] = m.round.courseRef.holes.map((h) => ({
      holeNumber: h.holeNumber, par: h.par, handicapIndex: h.handicapIndex,
    }));
    const slope = m.round.courseRef.teeBoxes.find((t) => t.name === m.round.activeTeeBox)?.slope ?? null;
    const players: PlayerInfo[] = m.players.map((mp) => ({
      playerId: mp.playerId, name: mp.player.name, handicap: mp.player.handicap, side: mp.side as Side,
    }));
    const scores: ScoreRow[] = m.scores.map((s) => ({
      hole: s.hole, side: s.side as Side, playerId: s.playerId, strokes: s.strokes,
    }));
    const state = computeMatchState({
      format: resolved.format, allowance: resolved.allowance, slope, holes, players, scores,
    });
    // Credit live points: once a match is final, the winning side earns; in-progress = 0.
    // (Skip "show running probability" — only award when resolved.)
    liveResults.push({
      matchId: m.id,
      teamAId: m.teamAId,
      teamBId: m.teamBId,
      pointsA: state.points.a ?? 0,
      pointsB: state.points.b ?? 0,
      final: state.matchStatus.final,
      label: state.matchStatus.label,
    });
  }

  const teamPoints: Record<string, number> = {};
  const teamFinalMatches: Record<string, number> = {};
  const teamInProgress: Record<string, number> = {};
  for (const t of teams) {
    teamPoints[t.id] = 0;
    teamFinalMatches[t.id] = 0;
    teamInProgress[t.id] = 0;
  }
  for (const r of liveResults) {
    teamPoints[r.teamAId] = (teamPoints[r.teamAId] ?? 0) + r.pointsA;
    teamPoints[r.teamBId] = (teamPoints[r.teamBId] ?? 0) + r.pointsB;
    if (r.final) {
      teamFinalMatches[r.teamAId] = (teamFinalMatches[r.teamAId] ?? 0) + 1;
      teamFinalMatches[r.teamBId] = (teamFinalMatches[r.teamBId] ?? 0) + 1;
    } else {
      teamInProgress[r.teamAId] = (teamInProgress[r.teamAId] ?? 0) + 1;
      teamInProgress[r.teamBId] = (teamInProgress[r.teamBId] ?? 0) + 1;
    }
  }

  const standings = teams.map((team) => ({
    id: team.id,
    name: team.name,
    teamNumber: team.teamNumber,
    color: team.color ?? (team.teamNumber === 1 ? '#C41E3A' : '#003DA5'),
    points: teamPoints[team.id] ?? 0,
    roster: team.members.length,
    finalMatches: teamFinalMatches[team.id] ?? 0,
    inProgress: teamInProgress[team.id] ?? 0,
  }));

  const teamA = standings[0];
  const teamB = standings[1];

  const rcRounds = await prisma.round.findMany({
    where: { isRyderCup: true },
    orderBy: { date: 'asc' },
    include: {
      matches: {
        orderBy: { matchNumber: 'asc' },
        include: {
          teamA: true,
          teamB: true,
          players: { include: { player: true } },
        },
      },
    },
  });

  // Quick lookup: matchId -> live result label
  const byMatch = new Map(liveResults.map((r) => [r.matchId, r]));

  return (
    <>
      <AppHeader title="Ryder Cup" />
      <main className="bg-ink-0 pb-nav">
        {/* Hero scoreboard */}
        <section className="px-4 pt-6">
          <div className="card-elevated">
            <p className="text-[10px] uppercase tracking-[0.25em] text-fg-3 text-center mb-4">
              Live
            </p>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="text-center">
                <div className="h-1.5 w-12 rounded-full mx-auto mb-3" style={{ backgroundColor: teamA?.color }} />
                <p className="text-xs uppercase tracking-wider text-fg-2 font-semibold">{teamA?.name ?? 'Team A'}</p>
                <p className="mt-2 text-6xl md:text-7xl font-bold tracking-tighter tabular-nums">
                  {teamA ? teamA.points.toFixed(1) : '—'}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-fg-3 mt-1">
                  {teamA?.finalMatches ?? 0} final · {teamA?.inProgress ?? 0} live
                </p>
              </div>

              <span className="text-fg-3 text-2xl font-light">–</span>

              <div className="text-center">
                <div className="h-1.5 w-12 rounded-full mx-auto mb-3" style={{ backgroundColor: teamB?.color }} />
                <p className="text-xs uppercase tracking-wider text-fg-2 font-semibold">{teamB?.name ?? 'Team B'}</p>
                <p className="mt-2 text-6xl md:text-7xl font-bold tracking-tighter tabular-nums">
                  {teamB ? teamB.points.toFixed(1) : '—'}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-fg-3 mt-1">
                  {teamB?.finalMatches ?? 0} final · {teamB?.inProgress ?? 0} live
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/ryder-cup/teams"
            className="mt-3 card flex items-center justify-between hover:border-fg-3 transition tap-highlight-none"
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
            {rcRounds.map((round) => (
              <SectionCard key={round.id} tone="masters">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-fg-3">
                      Round {round.roundNumber} · {round.dayOfWeek}
                    </p>
                    <h3 className="text-base font-semibold mt-0.5">{round.course}</h3>
                    <p className="text-xs text-fg-3 mt-0.5">{round.teeTime}</p>
                  </div>
                  <span className="pill">{round.format}</span>
                </div>

                {round.matches.length === 0 ? (
                  <p className="text-xs text-fg-3 italic">Pairings TBD</p>
                ) : (
                  <div className="space-y-2">
                    {round.matches.map((match) => {
                      const sideA = match.players.filter((p) => p.side === 'A');
                      const sideB = match.players.filter((p) => p.side === 'B');
                      const live = byMatch.get(match.id);
                      return (
                        <Link
                          key={match.id}
                          href={`/ryder-cup/match/${match.id}`}
                          className="block bg-ink-2 border border-ink-3 rounded-xl p-3 hover:border-fg-3 transition tap-highlight-none"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-wider text-fg-3">
                              Match {match.matchNumber}
                            </span>
                            {live ? (
                              <span
                                className={`pill ${
                                  live.final
                                    ? 'border-masters/60 text-masters-glow'
                                    : live.label.startsWith('AS')
                                    ? 'border-ink-3'
                                    : 'border-masters/40 text-masters-glow'
                                }`}
                              >
                                {live.label}
                              </span>
                            ) : (
                              <span className="pill">Upcoming</span>
                            )}
                          </div>
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: teamA?.color }}>
                                {match.teamA.name}
                              </p>
                              <p className="mt-0.5">{sideA.map((mp) => mp.player.name).join(' & ') || '—'}</p>
                            </div>
                            <span className="text-fg-3">vs</span>
                            <div className="text-right">
                              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: teamB?.color }}>
                                {match.teamB.name}
                              </p>
                              <p className="mt-0.5">{sideB.map((mp) => mp.player.name).join(' & ') || '—'}</p>
                            </div>
                          </div>
                          {live && live.final ? (
                            <p className="text-xs font-mono text-fg-2 mt-2 text-center">
                              {live.pointsA} – {live.pointsB}
                            </p>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            ))}
          </div>
        </section>
      </main>
      <BottomTabBar isAdmin={player?.isAdmin} />
    </>
  );
}
