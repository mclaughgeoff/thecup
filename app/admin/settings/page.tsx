import { requireAdmin } from '@/lib/auth';
import Header from '@/components/Header';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function SettingsPage() {
  const session = await requireAdmin();

  const player = await prisma.player.findUnique({
    where: { id: session.playerId },
  });

  const rounds = await prisma.round.findMany({
    orderBy: { date: 'asc' },
  });

  return (
    <>
      <Header player={{ id: player!.id, name: player!.name, isAdmin: player!.isAdmin }} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-cup-navy mb-8">⚙️ Settings</h1>

        <div className="space-y-6">
          {rounds.map((round) => (
            <div key={round.id} className="card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-cup-navy">
                    Round {round.roundNumber} · {round.dayOfWeek}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {round.date.toLocaleDateString()} · {round.course}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Ryder Cup:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        round.isRyderCup
                          ? 'bg-cup-green text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {round.isRyderCup ? '🏆 Yes' : '⚪ No'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Format:</span>
                    <span className="text-sm text-gray-600">{round.format}</span>
                  </div>
                </div>
              </div>

              <hr className="my-4" />

              <div className="space-y-3 text-sm">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Tee Time
                  </label>
                  <input
                    type="text"
                    defaultValue={round.teeTime}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="e.g., 8:15-8:41 AM"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Course
                    </label>
                    <input
                      type="text"
                      defaultValue={round.course}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Format
                    </label>
                    <input
                      type="text"
                      defaultValue={round.format}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      placeholder="Foursomes, Four-ball, etc."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={`rc-${round.id}`}
                    defaultChecked={round.isRyderCup}
                    className="w-4 h-4"
                  />
                  <label
                    htmlFor={`rc-${round.id}`}
                    className="font-semibold text-gray-700"
                  >
                    Ryder Cup Format (vs. Casual)
                  </label>
                </div>
              </div>

              <button className="mt-4 btn-primary text-sm">
                Save Changes
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 card bg-blue-50 border-l-4 border-blue-400">
          <h3 className="font-bold text-lg text-blue-900 mb-2">Coming Soon</h3>
          <p className="text-blue-800 text-sm">
            Settings form will save changes to the database. For now, use the Prisma dashboard to make updates.
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
