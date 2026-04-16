import { requireAuth } from '@/lib/auth';
import Header from '@/components/Header';
import PlayerAvatar from '@/components/PlayerAvatar';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { formatHandicap } from '@/lib/utils';
import { notFound } from 'next/navigation';

const prisma = new PrismaClient();

export default async function PlayerDetailPage({ params }: { params: { id: string } }) {
  const session = await requireAuth();

  const currentPlayer = await prisma.player.findUnique({
    where: { id: session.playerId },
  });

  const player = await prisma.player.findUnique({
    where: { id: params.id },
    include: { villa: true },
  });

  if (!player) {
    notFound();
  }

  return (
    <>
      <Header player={{ id: currentPlayer!.id, name: currentPlayer!.name, isAdmin: currentPlayer!.isAdmin }} />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/players" className="text-cup-green font-semibold hover:underline mb-6 inline-block">
          ← Back to Players
        </Link>

        <div className="card">
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <PlayerAvatar name={player.name} photoUrl={player.photoUrl} size="lg" />

            <div className="flex-1">
              <h1 className="text-4xl font-bold text-cup-navy mb-2">
                {player.name}
              </h1>

              {player.nickname && (
                <p className="text-xl text-gray-600 italic mb-4">"{player.nickname}"</p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-cup-green bg-opacity-10 rounded p-4">
                  <p className="text-sm text-gray-600">Handicap</p>
                  <p className="text-2xl font-bold text-cup-green">
                    {formatHandicap(player.handicap)}
                  </p>
                </div>

                {player.villa && (
                  <div className="bg-cup-navy bg-opacity-10 rounded p-4">
                    <p className="text-sm text-gray-600">Villa</p>
                    <p className="text-lg font-bold text-cup-navy">
                      {player.villa.name}
                    </p>
                  </div>
                )}
              </div>

              {player.isAdmin && (
                <div className="inline-block bg-cup-gold bg-opacity-20 text-cup-gold px-3 py-1 rounded-full text-sm font-semibold">
                  👑 Trip Admin
                </div>
              )}
            </div>
          </div>

          <hr className="my-8" />

          <h2 className="text-2xl font-bold text-cup-navy mb-4">Travel Info</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="font-bold text-cup-green mb-3">Arrival</h3>
              {player.arrivalDate ? (
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">Date:</span> {player.arrivalDate.toLocaleDateString()}</p>
                  <p><span className="text-gray-600">Time:</span> {player.arrivalTime || 'TBD'}</p>
                  <p><span className="text-gray-600">Airport:</span> {player.arrivalAirport || 'TBD'}</p>
                  <p><span className="text-gray-600">Flight:</span> {player.arrivalFlight || 'TBD'}</p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Not provided</p>
              )}
            </div>

            <div>
              <h3 className="font-bold text-cup-green mb-3">Departure</h3>
              {player.departureDate ? (
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">Date:</span> {player.departureDate.toLocaleDateString()}</p>
                  <p><span className="text-gray-600">Time:</span> {player.departureTime || 'TBD'}</p>
                  <p><span className="text-gray-600">Airport:</span> {player.departureAirport || 'TBD'}</p>
                  <p><span className="text-gray-600">Flight:</span> {player.departureFlight || 'TBD'}</p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Not provided</p>
              )}
            </div>
          </div>

          <div className="text-center">
            {session.playerId === player.id ? (
              <Link href="/profile" className="btn-primary">
                Edit Your Profile
              </Link>
            ) : (
              <p className="text-gray-600 text-sm">
                You can view {player.name.split(' ')[0]}'s profile here.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
