import { requireAuth } from '@/lib/auth';
import Header from '@/components/Header';
import PlayerAvatar from '@/components/PlayerAvatar';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { formatHandicap } from '@/lib/utils';

const prisma = new PrismaClient();

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
      <Header player={{ id: currentPlayer!.id, name: currentPlayer!.name, isAdmin: currentPlayer!.isAdmin }} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-cup-navy mb-8">👥 Players</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((p) => (
            <Link
              key={p.id}
              href={`/players/${p.id}`}
              className="card hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-4">
                <PlayerAvatar name={p.name} photoUrl={p.photoUrl} size="lg" />
                <div>
                  <h3 className="font-bold text-lg text-cup-navy">
                    {p.name}
                  </h3>
                  {p.nickname && (
                    <p className="text-sm text-gray-600 italic">{p.nickname}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Handicap</span>
                  <span className="font-bold text-cup-green">
                    {formatHandicap(p.handicap)}
                  </span>
                </div>

                {p.villa && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Villa</span>
                    <span className="font-semibold">{p.villa.name}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/dashboard" className="btn-outline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
}
