import { requireAuth } from '@/lib/auth';
import Header from '@/components/Header';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function SchedulePage() {
  const session = await requireAuth();

  const player = await prisma.player.findUnique({
    where: { id: session.playerId },
  });

  const rounds = await prisma.round.findMany({
    orderBy: { date: 'asc' },
    include: {
      groups: {
        include: {
          matches: {
            include: {
              player1: true,
              player2: true,
              player3: true,
              player4: true,
            },
          },
        },
      },
    },
  });

  return (
    <>
      <Header player={{ id: player!.id, name: player!.name, isAdmin: player!.isAdmin }} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-cup-navy mb-8">📅 Schedule</h1>

        <div className="space-y-8">
          {rounds.map((round) => (
            <div key={round.id} className="card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-cup-navy">
                    Round {round.roundNumber} · {round.dayOfWeek}
                  </h2>
                  <p className="text-gray-600">
                    {round.date.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                  <p className="font-bold text-cup-green">{round.course}</p>
                  <p className="text-sm text-gray-600">{round.teeTime}</p>
                  <p className="text-xs mt-2">
                    {round.isRyderCup ? (
                      <span className="text-cup-green font-bold">🏆 Ryder Cup</span>
                    ) : (
                      <span className="text-gray-500">⚪ Casual</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">{round.format}</span>
                </p>
              </div>

              {round.groups.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {round.groups.map((group) => (
                    <div key={group.id} className="bg-gray-50 rounded p-4">
                      <h3 className="font-bold text-cup-navy mb-3">Group {group.groupNumber}</h3>
                      {group.matches.length > 0 ? (
                        <div className="space-y-2 text-sm">
                          {group.matches.map((match) => (
                            <div key={match.id} className="flex gap-2">
                              <div className="flex-1">
                                <p className="font-semibold text-xs">
                                  {match.player1.name} & {match.player2.name}
                                  {match.player3 && ` (vs ${match.player3.name}`}
                                  {match.player4 && ` & ${match.player4.name}`}
                                  {match.player3 && ')'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Groups TBD</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Groups not yet assigned</p>
              )}
            </div>
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
