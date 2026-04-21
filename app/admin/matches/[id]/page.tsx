import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import MatchAdjustments from '@/components/admin/MatchAdjustments';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminMatchSettingsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireAdmin();

  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      teamA: true,
      teamB: true,
      round: true,
      players: { include: { player: true } },
    },
  });
  if (!match) notFound();

  const me = await prisma.player.findUnique({ where: { id: session.playerId } });

  return (
    <div className="pb-nav">
      <AppHeader title={`Match ${match.matchNumber}`} />
      <main className="max-w-2xl mx-auto">
        <div className="px-4 pt-3 pb-2">
          <Link
            href={`/admin/ryder-cup/rounds/${match.round.id}`}
            className="text-xs text-masters font-semibold"
          >
            ← Round {match.round.roundNumber} matchups
          </Link>
          <h1 className="text-xl font-semibold text-fg-1 mt-1">
            {match.teamA.name} vs {match.teamB.name}
          </h1>
          <p className="text-xs text-fg-3 mt-1">
            Round {match.round.roundNumber} · {match.round.dayOfWeek} · {match.round.course}
          </p>
        </div>

        <div className="px-4 pt-4">
          <MatchAdjustments
            matchId={match.id}
            teamAName={match.teamA.name}
            teamBName={match.teamB.name}
          />
        </div>
      </main>
      <BottomTabBar isAdmin={me?.isAdmin} />
    </div>
  );
}
