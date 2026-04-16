import { requireAuth } from '@/lib/auth';
import Header from '@/components/Header';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function LeaderboardPage() {
  const session = await requireAuth();

  const player = await prisma.player.findUnique({
    where: { id: session.playerId },
  });

  const rounds = await prisma.round.findMany({
    orderBy: { date: 'asc' },
    include: {
      teams: {
        include: {
          members: true,
          matches: {
            include: {
              player1: true,
              player2: true,
            },
          },
        },
      },
    },
  });

  // Calculate standings
  const standings = new Map<
    string,
    { teamNumber: number; roundId: string; points: number }
  >();

  rounds.forEach((round) => {
    round.teams.forEach((team) => {
      let points = 0;
      team.matches.forEach((match) => {
        if (match.points1 !== null && match.points2 !== null) {
          points += team.teamNumber === 1 ? match.points1 : match.points2;
        }
      });

      const key = `${round.id}-${team.teamNumber}`;
      standings.set(key, { teamNumber: team.teamNumber, roundId: round.id, points });
    });
  });

  return (
    <>
      <Header player={{ id: player!.id, name: player!.name, isAdmin: player!.isAdmin }} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-cup-navy mb-8">🏆 Leaderboard</h1>

        {rounds.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 text-lg">No rounds scheduled yet</p>
          </div>
        ) : (
          <div className="space-y-8">
            {rounds.map((round) => {
              const roundStandings = Array.from(standings.entries())
                .filter(([key]) => key.startsWith(round.id))
                .map(([, value]) => value)
                .sort((a, b) => b.points - a.points);

              return (
                <div key={round.id} className="card">
                  <h2 className="text-2xl font-bold text-cup-navy mb-4">
                    Round {round.roundNumber} · {round.dayOfWeek}
                  </h2>

                  {round.teams.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      {round.teams.map((team) => {
                        const teamStanding = roundStandings.find(
                          s => s.teamNumber === team.teamNumber
                        );

                        return (
                          <div
                            key={team.id}
                            className={`p-4 rounded-lg ${
                              team.teamNumber === 1
                                ? 'bg-blue-50 border-2 border-blue-300'
                                : 'bg-red-50 border-2 border-red-300'
                            }`}
                          >
                            <h3 className="font-bold text-lg mb-3">
                              {team.teamNumber === 1 ? '🔵' : '🔴'} Team {team.teamNumber}
                            </h3>

                            <p className="text-2xl font-bold mb-4">
                              {teamStanding?.points.toFixed(1) || '0'} pts
                            </p>

                            <div className="space-y-2 mb-4">
                              {team.members.map((member) => (
                                <div
                                  key={member.id}
                                  className="flex justify-between text-sm"
                                >
                                  <span className="font-semibold">
                                    {member.playerId ? '✓' : ''}
                                  </span>
                                  <span className="text-gray-600">{member.playerId}</span>
                                </div>
                              ))}
                            </div>

                            {team.matches.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-gray-600 mb-2">
                                  Matches
                                </p>
                                <div className="space-y-1">
                                  {team.matches.map((match) => (
                                    <div key={match.id} className="text-xs">
                                      <p className="text-gray-700">
                                        {match.player1.name} & {match.player2.name}
                                      </p>
                                      {match.result && (
                                        <p className="text-gray-500 text-xs">
                                          {match.result}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500">Teams not yet assigned</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href="/dashboard" className="btn-outline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
}
