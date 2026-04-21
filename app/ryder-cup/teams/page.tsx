import { requireAuth } from '@/lib/auth';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import PlayerAvatar from '@/components/PlayerAvatar';
import { formatHandicap } from '@/lib/utils';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function RyderCupTeamsPage() {
  const session = await requireAuth();

  const player = await prisma.player.findUnique({ where: { id: session.playerId } });

  const teams = await prisma.ryderCupTeam.findMany({
    orderBy: { teamNumber: 'asc' },
    include: {
      members: {
        include: { player: true },
        orderBy: { player: { handicap: 'asc' } },
      },
    },
  });

  return (
    <>
      <AppHeader title="Team rosters" backHref="/ryder-cup" />
      <main className="bg-ink-0 pb-nav">
        <div className="px-4 pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {teams.map((team) => {
            const color = team.color ?? (team.teamNumber === 1 ? '#C41E3A' : '#003DA5');
            return (
              <section key={team.id} className="card">
                <div
                  className="h-1.5 w-12 rounded-full mb-3"
                  style={{ backgroundColor: color }}
                />
                <p className="text-[10px] uppercase tracking-wider text-fg-3">Team {team.teamNumber}</p>
                <h2 className="text-xl font-semibold mt-0.5">{team.name}</h2>
                <p className="text-xs text-fg-3 mt-1 mb-4">
                  {team.members.length}/8 players
                </p>

                {team.members.length === 0 ? (
                  <p className="text-sm text-fg-3 italic">Roster not set.</p>
                ) : (
                  <ul className="space-y-2">
                    {team.members.map((m) => (
                      <li key={m.id}>
                        <Link
                          href={`/players/${m.player.id}`}
                          className="flex items-center gap-3 p-2 rounded-xl bg-ink-2 border border-ink-3 hover:border-fg-3 transition tap-highlight-none"
                        >
                          <PlayerAvatar name={m.player.name} photoUrl={m.player.photoUrl} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{m.player.name}</p>
                          </div>
                          <span className="text-sm font-mono text-gold">
                            {formatHandicap(m.player.handicap)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </main>
      <BottomTabBar isAdmin={player?.isAdmin} />
    </>
  );
}
