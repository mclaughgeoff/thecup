import { requireAuth } from '@/lib/auth';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import PlayerAvatar from '@/components/PlayerAvatar';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { formatHandicap } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function TeamsPage() {
  const session = await requireAuth();

  const [currentPlayer, teams, allPlayers] = await Promise.all([
    prisma.player.findUnique({ where: { id: session.playerId } }),
    prisma.ryderCupTeam.findMany({
      orderBy: { teamNumber: 'asc' },
      include: {
        members: {
          include: { player: { include: { villa: true } } },
          orderBy: { player: { handicap: 'asc' } },
        },
      },
    }),
    prisma.player.findMany({
      include: { ryderCupTeam: true },
      orderBy: { handicap: 'asc' },
    }),
  ]);

  const assignedIds = new Set(
    teams.flatMap((t) => t.members.map((m) => m.playerId)),
  );
  const unassigned = allPlayers.filter((p) => !assignedIds.has(p.id));

  return (
    <>
      <AppHeader title="Teams" backHref="/dashboard" />
      <main className="bg-ink-0 pb-nav">
        <div className="px-4 pt-4 space-y-6">
          {teams.map((team) => {
            const color = team.color ?? (team.teamNumber === 1 ? '#C41E3A' : '#003DA5');
            const players = team.members.map((m) => m.player);
            return (
              <section key={team.id}>
                <header className="flex items-end justify-between mb-3 px-1">
                  <div>
                    <div
                      className="h-1.5 w-12 rounded-full mb-2"
                      style={{ backgroundColor: color }}
                    />
                    <p
                      className="text-[10px] uppercase tracking-widest font-semibold"
                      style={{ color }}
                    >
                      Team {team.teamNumber}
                    </p>
                    <h2 className="text-xl font-semibold text-fg-1 mt-0.5">
                      {team.name}
                    </h2>
                  </div>
                  <p className="text-xs text-fg-3">
                    {players.length}/8 players
                  </p>
                </header>

                {players.length === 0 ? (
                  <div className="card text-sm text-fg-3 italic">
                    Roster not set.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                    {players.map((p) => (
                      <PlayerCard key={p.id} player={p} accent={color} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}

          {unassigned.length > 0 ? (
            <section>
              <header className="mb-3 px-1">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-fg-3">
                  Unassigned
                </p>
                <h2 className="text-xl font-semibold text-fg-1 mt-0.5">
                  Not yet drafted
                </h2>
                <p className="text-xs text-fg-3 mt-1">
                  {unassigned.length} player{unassigned.length === 1 ? '' : 's'}
                </p>
              </header>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {unassigned.map((p) => (
                  <PlayerCard key={p.id} player={p} accent={null} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>
      <BottomTabBar isAdmin={currentPlayer?.isAdmin} />
    </>
  );
}

function PlayerCard({
  player,
  accent,
}: {
  player: {
    id: string;
    name: string;
    nickname: string | null;
    handicap: number;
    photoUrl: string | null;
  };
  accent: string | null;
}) {
  return (
    <Link
      href={`/players/${player.id}`}
      className="card flex flex-col items-center text-center hover:border-fg-3 transition tap-highlight-none"
    >
      <div
        className="w-full aspect-square rounded-xl overflow-hidden bg-ink-2 ring-1 ring-ink-3 mb-3"
        style={accent ? { boxShadow: `inset 0 0 0 2px ${accent}22` } : undefined}
      >
        {player.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.photoUrl}
            alt={player.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PlayerAvatar name={player.name} photoUrl={null} size="xl" ring={false} />
          </div>
        )}
      </div>
      <p className="font-semibold text-sm leading-tight">{player.name}</p>
      {player.nickname ? (
        <p className="text-[11px] text-fg-3 italic">&ldquo;{player.nickname}&rdquo;</p>
      ) : null}
      <p className="mt-2 font-mono text-base text-gold">
        {formatHandicap(player.handicap)}
      </p>
    </Link>
  );
}
