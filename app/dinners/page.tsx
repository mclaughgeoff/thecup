import { requireAuth } from '@/lib/auth';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import SectionCard from '@/components/SectionCard';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const DAY_ORDER = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const DAY_LABELS: Record<string, string> = {
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

export default async function DinnersPage() {
  const session = await requireAuth();
  const player = await prisma.player.findUnique({ where: { id: session.playerId } });

  const reservations = await prisma.mealReservation.findMany({
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  });

  const groups = new Map<string, typeof reservations>();
  for (const r of reservations) {
    const arr = groups.get(r.dayOfWeek) ?? [];
    arr.push(r);
    groups.set(r.dayOfWeek, arr);
  }

  const sortedDays = Array.from(groups.keys()).sort(
    (a, b) => DAY_ORDER.indexOf(a as any) - DAY_ORDER.indexOf(b as any),
  );

  return (
    <>
      <AppHeader title="Meals" backHref="/dashboard" />
      <main className="bg-ink-0 pb-nav">
        {reservations.length === 0 ? (
          <div className="px-4 pt-8">
            <div className="card text-center">
              <p className="text-fg-2 text-sm">No meal reservations yet.</p>
            </div>
          </div>
        ) : (
          <div className="px-4 pt-4 space-y-5">
            {sortedDays.map((day) => (
              <section key={day}>
                <h2 className="label mb-3">{DAY_LABELS[day] ?? day}</h2>
                <div className="space-y-3">
                  {groups.get(day)!.map((r) => (
                    <SectionCard key={r.id} tone={r.mealType === 'dinner' ? 'gold' : 'default'}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-fg-3">
                            {r.mealType}
                          </p>
                          <h3 className="text-base font-semibold mt-0.5">{r.restaurant}</h3>
                          <p className="text-sm text-fg-2 mt-0.5">{r.time}</p>
                        </div>
                        {r.confirmed ? (
                          <span className="pill border-masters/60 text-masters-glow">Confirmed</span>
                        ) : (
                          <span className="pill">Tentative</span>
                        )}
                      </div>

                      {r.notes ? (
                        <p className="text-xs text-fg-3 mt-2 leading-relaxed">{r.notes}</p>
                      ) : null}

                      {r.headcount ? (
                        <p className="text-xs text-fg-3 mt-2">Party of {r.headcount}</p>
                      ) : null}

                      {r.address ? (
                        <a
                          href={`https://maps.apple.com/?q=${encodeURIComponent(r.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-ghost text-xs mt-3 w-full py-2"
                        >
                          Get directions
                        </a>
                      ) : null}
                    </SectionCard>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      <BottomTabBar isAdmin={player?.isAdmin} />
    </>
  );
}
