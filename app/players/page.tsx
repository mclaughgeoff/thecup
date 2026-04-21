import { requireAuth } from '@/lib/auth';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import PlayerAvatar from '@/components/PlayerAvatar';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { formatHandicap } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function PlayersPage() {
  const session = await requireAuth();

  const currentPlayer = await prisma.player.findUnique({
    where: { id: session.playerId },
  });

  const players = await prisma.player.findMany({
    include: { villa: true },
    orderBy: { handicap: 'asc' },
  });

  return (
    <>
      <AppHeader title="Players" backHref="/dashboard" />
      <main className="bg-ink-0 pb-nav">
        <div className="px-4 pt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {players.map((p) => (
            <Link
              key={p.id}
              href={`/players/${p.id}`}
              className="card flex flex-col items-center text-center hover:border-fg-3 transition tap-highlight-none"
            >
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-ink-2 ring-1 ring-ink-3 mb-3">
                {p.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.photoUrl}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PlayerAvatar name={p.name} photoUrl={null} size="xl" ring={false} />
                  </div>
                )}
              </div>
              <p className="font-semibold text-sm leading-tight">{p.name}</p>
              {p.nickname ? (
                <p className="text-[11px] text-fg-3 italic">"{p.nickname}"</p>
              ) : null}
              <p className="mt-2 font-mono text-base text-gold">
                {formatHandicap(p.handicap)}
              </p>
            </Link>
          ))}
        </div>
      </main>
      <BottomTabBar isAdmin={currentPlayer?.isAdmin} />
    </>
  );
}
