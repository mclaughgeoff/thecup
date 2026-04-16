import { requireAdmin } from '@/lib/auth';
import Header from '@/components/Header';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function AdminPage() {
  const session = await requireAdmin();

  const player = await prisma.player.findUnique({
    where: { id: session.playerId },
  });

  const players = await prisma.player.findMany();
  const uninvitedPlayers = players.filter((p) => !p.inviteSent);
  const rounds = await prisma.round.findMany();

  return (
    <>
      <Header player={{ id: player!.id, name: player!.name, isAdmin: player!.isAdmin }} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-cup-navy mb-8">⚙️ Admin Panel</h1>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link
            href="/admin/invites"
            className="card bg-cup-gold bg-opacity-10 hover:shadow-lg hover:scale-105 transition-all cursor-pointer border-2 border-cup-gold"
          >
            <h2 className="text-xl font-bold text-cup-gold mb-2">📧 Send Invites</h2>
            <p className="text-gray-600 mb-4">
              {uninvitedPlayers.length} player(s) waiting for invites
            </p>
            <p className="text-sm text-gray-600">
              Send magic links to players to start their signup
            </p>
          </Link>

          <Link
            href="/admin/teams"
            className="card bg-cup-gold bg-opacity-10 hover:shadow-lg hover:scale-105 transition-all cursor-pointer border-2 border-cup-gold"
          >
            <h2 className="text-xl font-bold text-cup-gold mb-2">👥 Team Setup</h2>
            <p className="text-gray-600 mb-4">
              {rounds.length} round(s) configured
            </p>
            <p className="text-sm text-gray-600">
              Set teams and groups for each round
            </p>
          </Link>

          <Link
            href="/admin/scoring"
            className="card bg-cup-gold bg-opacity-10 hover:shadow-lg hover:scale-105 transition-all cursor-pointer border-2 border-cup-gold"
          >
            <h2 className="text-xl font-bold text-cup-gold mb-2">📊 Scoring</h2>
            <p className="text-gray-600 mb-4">
              Enter match results & scores
            </p>
            <p className="text-sm text-gray-600">
              Update hole-by-hole scoring in real-time
            </p>
          </Link>

          <Link
            href="/admin/settings"
            className="card bg-cup-gold bg-opacity-10 hover:shadow-lg hover:scale-105 transition-all cursor-pointer border-2 border-cup-gold"
          >
            <h2 className="text-xl font-bold text-cup-gold mb-2">⚙️ Settings</h2>
            <p className="text-gray-600 mb-4">
              Manage rounds & formats
            </p>
            <p className="text-sm text-gray-600">
              Configure courses, tee times, RC vs casual
            </p>
          </Link>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-cup-navy mb-4">Quick Stats</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-cup-green bg-opacity-10 rounded p-4 text-center">
              <p className="text-3xl font-bold text-cup-green">{players.length}</p>
              <p className="text-gray-600 text-sm">Total Players</p>
            </div>

            <div className="bg-cup-green bg-opacity-10 rounded p-4 text-center">
              <p className="text-3xl font-bold text-cup-green">
                {players.filter((p) => p.inviteSent).length}
              </p>
              <p className="text-gray-600 text-sm">Invited</p>
            </div>

            <div className="bg-cup-green bg-opacity-10 rounded p-4 text-center">
              <p className="text-3xl font-bold text-cup-green">
                {rounds.length}
              </p>
              <p className="text-gray-600 text-sm">Rounds</p>
            </div>

            <div className="bg-cup-green bg-opacity-10 rounded p-4 text-center">
              <p className="text-3xl font-bold text-cup-green">
                {rounds.filter((r) => r.isRyderCup).length}
              </p>
              <p className="text-gray-600 text-sm">RC Rounds</p>
            </div>
          </div>
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
