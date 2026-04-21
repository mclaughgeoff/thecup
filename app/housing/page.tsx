import { requireAuth } from '@/lib/auth';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import PlayerAvatar from '@/components/PlayerAvatar';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HousingPage() {
  const session = await requireAuth();

  const player = await prisma.player.findUnique({
    where: { id: session.playerId },
  });

  const villas = await prisma.villa.findMany({
    include: {
      players: { orderBy: { name: 'asc' } },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <>
      <AppHeader title="Housing" backHref="/dashboard" />
      <main className="bg-ink-0 pb-nav">
        <div className="px-4 pt-4 space-y-3">
          {villas.map((villa) => {
            const isMine = villa.players.some((p) => p.id === session.playerId);
            return (
              <section
                key={villa.id}
                className={`card ${isMine ? 'border-gold/40' : ''}`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h2 className="text-lg font-semibold">{villa.name}</h2>
                    <p className="text-xs text-fg-2 mt-1 leading-relaxed">
                      {villa.address}
                    </p>
                  </div>
                  {isMine ? (
                    <span className="pill border-gold/40 text-gold">Your villa</span>
                  ) : null}
                </div>

                <p className="text-[10px] uppercase tracking-wider text-fg-3 mb-2">
                  {villa.players.length} resident{villa.players.length === 1 ? '' : 's'}
                </p>

                <div className="flex flex-wrap gap-2">
                  {villa.players.map((p) => (
                    <Link
                      key={p.id}
                      href={`/players/${p.id}`}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-ink-2 border border-ink-3 hover:border-fg-3 transition tap-highlight-none"
                    >
                      <PlayerAvatar name={p.name} photoUrl={p.photoUrl} size="sm" />
                      <span className="text-xs font-medium pr-1">
                        {p.name.split(' ')[0]}
                        {p.id === session.playerId ? ' · you' : ''}
                      </span>
                    </Link>
                  ))}
                  {villa.players.length === 0 ? (
                    <p className="text-sm text-fg-3 italic">No residents yet</p>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      </main>
      <BottomTabBar isAdmin={player?.isAdmin} />
    </>
  );
}
