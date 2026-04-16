import { requireAdmin } from '@/lib/auth';
import Header from '@/components/Header';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function ScoringPage() {
  const session = await requireAdmin();

  const player = await prisma.player.findUnique({
    where: { id: session.playerId },
  });

  const rounds = await prisma.round.findMany({
    include: {
      groups: {
        include: {
          matches: {
            include: {
              player1: true,
              player2: true,
              player3: true,
              player4: true,
              scores: true,
            },
          },
        },
      },
    },
    orderBy: { date: 'asc' },
  });

  return (
    <>
      <Header player={{ id: player!.id, name: player!.name, isAdmin: player!.isAdmin }} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-cup-navy mb-8">📊 Scoring</h1>

        <div className="space-y-8">
          {rounds.map((round) => (
            <div key={round.id} className="card">
              <h2 className="text-2xl font-bold text-cup-navy mb-4">
                Round {round.roundNumber} · {round.dayOfWeek}
              </h2>

              <p className="text-sm text-gray-600 mb-6">
                {round.date.toLocaleDateString()} · {round.course} · {round.format}
              </p>

              {round.groups.length > 0 ? (
                <div className="space-y-4">
                  {round.groups.map((group) => (
                    <div key={group.id} className="bg-gray-50 rounded p-4 border-l-4 border-cup-green">
                      <h3 className="font-bold text-cup-navy mb-3">
                        Group {group.groupNumber}
                      </h3>

                      {group.matches.length > 0 ? (
                        <div className="space-y-3">
                          {group.matches.map((match) => (
                            <div
                              key={match.id}
                              className="bg-white p-3 rounded border border-gray-200"
                            >
                              <p className="font-semibold text-sm mb-2">
                                {match.player1.name} & {match.player2.name}
                                {match.player3 && ` vs ${match.player3.name}`}
                                {match.player4 && ` & ${match.player4.name}`}
                              </p>

                              {match.result ? (
                                <div className="text-sm text-gray-600">
                                  <p className="font-semibold text-cup-green">
                                    Result: {match.result}
                                  </p>
                                  <p className="text-xs mt-1">
                                    Points: {match.points1} - {match.points2}
                                  </p>
                                </div>
                              ) : (
                                <button className="btn-outline text-xs">
                                  Enter Score
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No matches</p>
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

        <div className="mt-12 card bg-blue-50 border-l-4 border-blue-400">
          <h3 className="font-bold text-lg text-blue-900 mb-2">Coming Soon</h3>
          <p className="text-blue-800 text-sm">
            Hole-by-hole and match result entry interface. Scoring can be updated via API in the interim.
          </p>
        </div>

        <div className="mt-12 text-center">
          <Link href="/admin" className="btn-outline">
            ← Back to Admin Panel
          </Link>
        </div>
      </div>
    </>
  );
}
