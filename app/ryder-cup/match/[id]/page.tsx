import { requireAuth } from '@/lib/auth';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import PlayerAvatar from '@/components/PlayerAvatar';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function RyderCupMatchPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireAuth();
  const player = await prisma.player.findUnique({ where: { id: session.playerId } });

  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      teamA: true,
      teamB: true,
      round: { include: { courseRef: true } },
      players: { include: { player: true } },
    },
  });

  if (!match) notFound();

  const sideA = match.players.filter((p) => p.side === 'A');
  const sideB = match.players.filter((p) => p.side === 'B');
  const isFinal = match.pointsA !== null && match.pointsB !== null;

  return (
    <>
      <AppHeader title={`Match ${match.matchNumber}`} backHref="/ryder-cup" />
      <main className="bg-ink-0 pb-nav">
        <section className="px-4 pt-4">
          <div className="card-elevated">
            <p className="text-[10px] uppercase tracking-widest text-fg-3 text-center">
              Round {match.round.roundNumber} · {match.round.dayOfWeek} · {match.round.format}
            </p>
            <p className="text-center text-sm text-fg-2 mt-1">
              {match.round.course} · {match.round.teeTime}
            </p>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mt-6">
              <div>
                <p
                  className="text-[10px] uppercase tracking-wider font-semibold"
                  style={{ color: match.teamA.color ?? '#C41E3A' }}
                >
                  {match.teamA.name}
                </p>
                <div className="mt-2 space-y-2">
                  {sideA.length === 0 ? (
                    <p className="text-xs text-fg-3 italic">No players</p>
                  ) : (
                    sideA.map((mp) => (
                      <div key={mp.id} className="flex items-center gap-2">
                        <PlayerAvatar name={mp.player.name} photoUrl={mp.player.photoUrl} size="sm" />
                        <span className="text-sm">{mp.player.name}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <span className="text-fg-3 font-light">vs</span>

              <div className="text-right">
                <p
                  className="text-[10px] uppercase tracking-wider font-semibold"
                  style={{ color: match.teamB.color ?? '#003DA5' }}
                >
                  {match.teamB.name}
                </p>
                <div className="mt-2 space-y-2">
                  {sideB.length === 0 ? (
                    <p className="text-xs text-fg-3 italic">No players</p>
                  ) : (
                    sideB.map((mp) => (
                      <div key={mp.id} className="flex items-center justify-end gap-2">
                        <span className="text-sm">{mp.player.name}</span>
                        <PlayerAvatar name={mp.player.name} photoUrl={mp.player.photoUrl} size="sm" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {isFinal ? (
              <div className="mt-6 pt-4 border-t border-ink-3 text-center">
                <p className="text-[10px] uppercase tracking-widest text-fg-3 mb-2">Final</p>
                <p className="text-4xl font-mono font-semibold text-masters-glow">
                  {match.pointsA} – {match.pointsB}
                </p>
                {match.result ? (
                  <p className="text-xs text-fg-2 mt-2">{match.result}</p>
                ) : null}
              </div>
            ) : (
              <div className="mt-6 pt-4 border-t border-ink-3 text-center">
                <span className="pill">Upcoming</span>
              </div>
            )}
          </div>
        </section>

        {match.round.courseRef ? (
          <section className="px-4 pt-4">
            <Link
              href={`/ryder-cup/match/${match.id}`}
              className="card flex items-center justify-between hover:border-fg-3 transition tap-highlight-none pointer-events-none opacity-80"
            >
              <div>
                <p className="text-[10px] uppercase tracking-wider text-fg-3">Course</p>
                <p className="text-sm font-semibold mt-0.5">{match.round.courseRef.name}</p>
                <p className="text-xs text-fg-3 mt-0.5">
                  {match.round.courseRef.designer ? `Designed by ${match.round.courseRef.designer}` : null}
                </p>
              </div>
              {match.round.activeTeeBox ? (
                <span className="pill">{match.round.activeTeeBox} tees</span>
              ) : null}
            </Link>
          </section>
        ) : null}
      </main>
      <BottomTabBar isAdmin={player?.isAdmin} />
    </>
  );
}
