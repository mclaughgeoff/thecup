import { requireAdmin } from '@/lib/auth';
import Header from '@/components/Header';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function TeamsPage() {
  const session = await requireAdmin();

  const player = await prisma.player.findUnique({
    where: { id: session.playerId },
  });

  const rounds = await prisma.round.findMany({
    include: {
      teams: {
        include: { members: true },
      },
    },
    orderBy: { date: 'asc' },
  });

  return (
    <>
      <Header player={{ id: player!.id, name: player!.name, isAdmin: player!.isAdmin }} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-cup-navy mb-8">👥 Team Setup</h1>

        <div className="space-y-8">
          {rounds.map((round) => (
            <div key={round.id} className="card">
              <h2 className="text-2xl font-bold text-cup-navy mb-4">
                Round {round.roundNumber} · {round.dayOfWeek}
              </h2>

              <p className="text-sm text-gray-600 mb-4">
                {round.date.toLocaleDateString()} · {round.course}
              </p>

              {round.teams.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {round.teams.map((team) => (
                    <div key={team.id} className="bg-gray-50 rounded p-4">
                      <h3 className="font-bold text-lg text-cup-navy mb-3">
                        Team {team.teamNumber}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Members: {team.members.length}/8
                      </p>
                      <button className="btn-outline text-sm">
                        Assign Players
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Teams not configured</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 card bg-blue-50 border-l-4 border-blue-400">
          <h3 className="font-bold text-lg text-blue-900 mb-2">Coming Soon</h3>
          <p className="text-blue-800 text-sm">
            Drag-and-drop team assignment interface. For now, teams can be set via direct database updates.
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
