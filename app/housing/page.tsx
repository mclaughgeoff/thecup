import { requireAuth } from '@/lib/auth';
import Header from '@/components/Header';
import PlayerAvatar from '@/components/PlayerAvatar';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function HousingPage() {
  const session = await requireAuth();

  const player = await prisma.player.findUnique({
    where: { id: session.playerId },
  });

  const villas = await prisma.villa.findMany({
    include: {
      players: {
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <>
      <Header player={{ id: player!.id, name: player!.name, isAdmin: player!.isAdmin }} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-cup-navy mb-8">🏠 Housing</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {villas.map((villa) => (
            <div key={villa.id} className="card">
              <h2 className="text-2xl font-bold text-cup-navy mb-2">
                {villa.name}
              </h2>

              <p className="text-gray-600 text-sm mb-6">
                <span className="text-cup-green font-semibold">📍</span> {villa.address}
              </p>

              <div className="mb-6">
                <h3 className="font-bold text-cup-green mb-3">
                  Residents ({villa.players.length})
                </h3>

                <div className="space-y-3">
                  {villa.players.map((p) => (
                    <Link
                      key={p.id}
                      href={`/players/${p.id}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded hover:bg-cup-green hover:bg-opacity-10 transition"
                    >
                      <PlayerAvatar name={p.name} photoUrl={p.photoUrl} size="sm" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{p.name}</p>
                        {p.nickname && (
                          <p className="text-xs text-gray-500 italic">{p.nickname}</p>
                        )}
                      </div>
                      {p.id === session.playerId && (
                        <span className="text-sm bg-cup-gold text-cup-navy px-2 py-1 rounded font-semibold">
                          You
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>

              {villa.players.length === 0 && (
                <p className="text-gray-500 text-sm">No residents assigned yet</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 card bg-cup-navy text-white">
          <h3 className="font-bold text-lg mb-2">Travel Tips</h3>
          <ul className="space-y-2 text-sm">
            <li>✓ Check out your villa's address above</li>
            <li>✓ Coordinate arrival times with your housemates</li>
            <li>✓ See flight details on each player's profile</li>
            <li>✓ Share contact info in the chat</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <Link href="/dashboard" className="btn-outline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
}
