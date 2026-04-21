import { requireAuth } from '@/lib/auth';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import SectionCard from '@/components/SectionCard';
import { ArrowRightIcon, UsersIcon } from '@/components/icons';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function RyderCupPage() {
  const session = await requireAuth();

  const player = await prisma.player.findUnique({ where: { id: session.playerId } });

  const teams = await prisma.ryderCupTeam.findMany({
    orderBy: { teamNumber: 'asc' },
    include: {
      matchSideA: true,
      matchSideB: true,
      members: true,
    },
  });

  const standings = teams.map((team) => {
    const pointsFromA = team.matchSideA.reduce((sum, m) => sum + (m.pointsA ?? 0), 0);
    const pointsFromB = team.matchSideB.reduce((sum, m) => sum + (m.pointsB ?? 0), 0);
    return {
      id: team.id,
      name: team.name,
      teamNumber: team.teamNumber,
      color: team.color ?? (team.teamNumber === 1 ? '#C41E3A' : '#003DA5'),
      points: pointsFromA + pointsFromB,
      roster: team.members.length,
    };
  });

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
                  {teamA?.roster ?? 0} players
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
                  {teamB?.roster ?? 0} players
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
                      const isFinal = match.pointsA !== null && match.pointsB !== null;
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
                            {isFinal ? (
                              <span className="pill border-masters/60 text-masters-glow">
                                {match.result ?? 'Final'}
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
                          {isFinal ? (
                            <p className="text-xs font-mono text-fg-2 mt-2 text-center">
                              {match.pointsA} – {match.pointsB}
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
