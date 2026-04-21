import { requireAuth } from '@/lib/auth';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import PlayerAvatar from '@/components/PlayerAvatar';
import { StarIcon } from '@/components/icons';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { formatHandicap } from '@/lib/utils';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-ink-3 last:border-b-0">
      <span className="text-xs uppercase tracking-wider text-fg-3">{label}</span>
      <span className="text-sm text-fg-1">{value ?? '—'}</span>
    </div>
  );
}

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
      <AppHeader title={player.name} backHref="/players" />
      <main className="bg-ink-0 pb-nav">
        <section className="px-4 pt-6">
          <div className="card-elevated flex flex-col items-center text-center">
            <PlayerAvatar name={player.name} photoUrl={player.photoUrl} size="xl" />
            <h1 className="mt-4 text-2xl font-semibold">{player.name}</h1>
            {player.nickname ? (
              <p className="text-sm text-fg-2 italic">"{player.nickname}"</p>
            ) : null}

            <div className="mt-5 flex items-center gap-6">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-fg-3">Handicap</p>
                <p className="text-2xl font-mono text-gold mt-0.5">
                  {formatHandicap(player.handicap)}
                </p>
              </div>
              {player.villa ? (
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-fg-3">Villa</p>
                  <p className="text-sm font-semibold mt-1">{player.villa.name}</p>
                </div>
              ) : null}
            </div>

            {player.isAdmin ? (
              <span className="mt-4 pill border-gold/40 text-gold">
                <StarIcon size={12} />
                Trip admin
              </span>
            ) : null}
          </div>
        </section>

        <section className="px-4 pt-6">
          <h2 className="label mb-2">Arrival</h2>
          <div className="card">
            <Field
              label="Date"
              value={player.arrivalDate ? player.arrivalDate.toLocaleDateString() : null}
            />
            <Field label="Time"    value={player.arrivalTime} />
            <Field label="Airport" value={player.arrivalAirport} />
            <Field label="Flight"  value={player.arrivalFlight} />
          </div>
        </section>

        <section className="px-4 pt-4">
          <h2 className="label mb-2">Departure</h2>
          <div className="card">
            <Field
              label="Date"
              value={player.departureDate ? player.departureDate.toLocaleDateString() : null}
            />
            <Field label="Time"    value={player.departureTime} />
            <Field label="Airport" value={player.departureAirport} />
            <Field label="Flight"  value={player.departureFlight} />
          </div>
        </section>

        {session.playerId === player.id ? (
          <section className="px-4 pt-6">
            <Link href="/profile" className="btn-primary w-full">
              Edit profile
            </Link>
          </section>
        ) : null}
      </main>
      <BottomTabBar isAdmin={currentPlayer?.isAdmin} />
    </>
  );
}
