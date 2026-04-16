import { requireAuth } from '@/lib/auth';
import Header from '@/components/Header';
import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export default async function DashboardPage() {
  try {
    const session = await requireAuth();

    const player = await prisma.player.findUnique({
      where: { id: session.playerId },
      include: { villa: true },
    });

    if (!player) {
      redirect('/');
    }

    const nextRound = await prisma.round.findFirst({
      where: { date: { gte: new Date() } },
      orderBy: { date: 'asc' },
    });

    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    return (
      <>
        <Header player={{ id: player.id, name: player.name, isAdmin: player.isAdmin }} />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-cup-navy mb-8">
            Welcome, {player.nickname || player.name.split(' ')[0]}! ⛳
          </h1>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Link
              href="/schedule"
              className="card hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              <h2 className="text-xl font-bold text-cup-green mb-2">📅 Schedule</h2>
              <p className="text-gray-600">View rounds, tee times & groups</p>
            </Link>

            <Link
              href="/leaderboard"
              className="card hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              <h2 className="text-xl font-bold text-cup-green mb-2">🏆 Leaderboard</h2>
              <p className="text-gray-600">Track team standings & scores</p>
            </Link>

            <Link
              href="/players"
              className="card hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              <h2 className="text-xl font-bold text-cup-green mb-2">👥 Players</h2>
              <p className="text-gray-600">Browse the roster & handicaps</p>
            </Link>

            <Link
              href="/profile"
              className="card hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              <h2 className="text-xl font-bold text-cup-green mb-2">👤 My Profile</h2>
              <p className="text-gray-600">Update your info & availability</p>
            </Link>

            <Link
              href="/housing"
              className="card hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              <h2 className="text-xl font-bold text-cup-green mb-2">🏠 Housing</h2>
              <p className="text-gray-600">Villa assignments & addresses</p>
            </Link>

            <Link
              href="/chat"
              className="card hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              <h2 className="text-xl font-bold text-cup-green mb-2">💬 Chat</h2>
              <p className="text-gray-600">Team chat & announcements</p>
            </Link>

            {player.isAdmin && (
              <Link
                href="/admin"
                className="card bg-cup-gold bg-opacity-10 hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
              >
                <h2 className="text-xl font-bold text-cup-gold mb-2">⚙️ Admin</h2>
                <p className="text-gray-600">Manage the trip</p>
              </Link>
            )}
          </div>

          {nextRound && (
            <div className="card bg-cup-green text-white mb-8">
              <h2 className="text-2xl font-bold mb-4">Next Round</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-cup-gold font-semibold">
                    {nextRound.dayOfWeek}, {nextRound.date.toLocaleDateString()}
                  </p>
                  <p className="text-lg mt-2">{nextRound.course}</p>
                  <p className="text-sm text-gray-200 mt-1">{nextRound.timeSlot} · {nextRound.teeTime}</p>
                </div>
                <div>
                  <p className="text-cup-gold font-semibold mb-2">Format</p>
                  <p className="text-lg">{nextRound.format}</p>
                  <p className="text-sm text-gray-200 mt-2">
                    {nextRound.isRyderCup ? '🏆 Ryder Cup' : '⚪ Casual'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {announcements.length > 0 && (
            <div className="card">
              <h2 className="text-2xl font-bold text-cup-navy mb-4">📢 Latest Announcements</h2>
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div key={ann.id} className="border-l-4 border-cup-gold pl-4 py-2">
                    <h3 className="font-bold text-cup-navy">{ann.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{ann.content}</p>
                    <p className="text-gray-400 text-xs mt-2">
                      {ann.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                href="/chat"
                className="text-cup-green font-semibold hover:underline mt-4 inline-block"
              >
                View all announcements →
              </Link>
            </div>
          )}

          <div className="card bg-cup-navy text-white">
            <h3 className="font-bold text-lg mb-2">Pro Tip</h3>
            <p>
              Check your profile to set your availability for each round. The admin will use this to set up groups and teams!
            </p>
          </div>
        </div>
      </>
    );
  } catch (error) {
    redirect('/auth/request-link');
  }
}
