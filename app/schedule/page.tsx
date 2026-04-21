import { requireAuth } from '@/lib/auth';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import SectionCard from '@/components/SectionCard';
import MatchupCard from '@/components/MatchupCard';
import FormatBadge from '@/components/FormatBadge';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const DAY_ORDER = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export default async function SchedulePage() {
  const session = await requireAuth();

  const player = await prisma.player.findUnique({
    where: { id: session.playerId },
  });

  const [rounds, totalPlayers] = await Promise.all([
    prisma.round.findMany({
      orderBy: { date: 'asc' },
      include: {
        formatRef: true,
        matches: {
          orderBy: { matchNumber: 'asc' },
          include: {
            teamA: true,
            teamB: true,
            players: { include: { player: true } },
          },
        },
        availabilities: true,
      },
    }),
    prisma.player.count(),
  ]);

  const days = Array.from(new Set(rounds.map((r) => r.dayOfWeek))).sort(
    (a, b) => DAY_ORDER.indexOf(a as any) - DAY_ORDER.indexOf(b as any),
  );

  return (
    <>
      <AppHeader title="Schedule" />
      <main className="bg-ink-0 pb-nav">
        {/* Day pills carousel */}
        <div className="sticky top-14 z-20 bg-ink-0/90 backdrop-blur-md border-b border-ink-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 py-3">
            {days.map((day) => (
              <a
                key={day}
                href={`#day-${day}`}
                className="pill shrink-0 border-ink-3 hover:border-masters hover:text-masters-glow transition"
              >
                {day}
              </a>
            ))}
          </div>
        </div>

        <div className="px-4 pt-4 space-y-4">
          {rounds.map((round) => {
            const isRC = round.isRyderCup;
            return (
              <SectionCard
                key={round.id}
                id={`day-${round.dayOfWeek}`}
                as="section"
                tone={isRC ? 'masters' : 'default'}
                className={
                  isRC
                    ? 'scroll-mt-32 border-l-4 border-l-masters'
                    : 'scroll-mt-32 border-dashed bg-cream-light/40'
                }
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-fg-3">
                      Round {round.roundNumber} · {round.dayOfWeek}
                    </p>
                    <h2 className="text-lg font-semibold mt-0.5">{round.course}</h2>
                    <p className="text-sm text-fg-2 mt-0.5">{round.teeTime}</p>
                  </div>
                  <span
                    className={`pill ${
                      isRC
                        ? 'border-masters/60 text-masters-glow bg-masters/5'
                        : 'border-ink-3 text-fg-3 bg-transparent'
                    }`}
                  >
                    {isRC ? 'Ryder Cup' : 'Logistics'}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-3 gap-2">
                  {isRC ? (
                    <FormatBadge
                      format={round.format}
                      slug={round.formatRef?.slug}
                      size="sm"
                    />
                  ) : (
                    <span className="text-[10px] uppercase tracking-widest text-fg-3 font-semibold">
                      Non-RC · No scoring
                    </span>
                  )}
                  {(() => {
                    const playing = round.availabilities.filter((a) => a.available).length;
                    const isShort = playing < totalPlayers;
                    return (
                      <span
                        className={`pill ${
                          isShort ? 'border-danger/40 text-danger' : 'border-ink-3 text-fg-2'
                        }`}
                      >
                        {playing}/{totalPlayers} playing
                      </span>
                    );
                  })()}
                </div>

                {round.teeSlots.length > 0 || round.matches.length > 0 ? (
                  <div className="space-y-4">
                    {Array.from({ length: Math.max(round.teeSlots.length, 1) }).map((_, slotIdx) => {
                      const teeTime = round.teeSlots[slotIdx] ?? null;
                      const slotMatches = round.matches
                        .filter((m) => (m.teeSlotIndex ?? m.matchNumber - 1) === slotIdx)
                        .sort((a, b) => a.matchNumber - b.matchNumber);
                      return (
                        <div key={`slot-${slotIdx}`} className="space-y-2">
                          {teeTime ? (
                            <div className="flex items-baseline justify-between px-1">
                              <p className="text-[10px] uppercase tracking-widest text-fg-3">
                                Tee time {slotIdx + 1}
                              </p>
                              <p className="text-sm font-mono">{teeTime}</p>
                            </div>
                          ) : null}
                          {slotMatches.length === 0 ? (
                            <div className="bg-ink-2 border border-ink-3 rounded-xl p-3">
                              <span className="text-xs text-fg-3">TBD</span>
                            </div>
                          ) : (
                            slotMatches.map((match) => (
                              <MatchupCard
                                key={match.id}
                                matchNumber={match.matchNumber}
                                teeTime={teeTime}
                                strokeEntryMode={round.formatRef?.strokeEntryMode}
                                format={isRC ? round.format : null}
                                formatSlug={isRC ? round.formatRef?.slug : null}
                                teamA={{ name: match.teamA.name, color: match.teamA.color }}
                                teamB={{ name: match.teamB.name, color: match.teamB.color }}
                                players={match.players.map((mp) => ({
                                  playerId: mp.playerId,
                                  name: mp.player.name,
                                  handicap: mp.player.handicap,
                                  photoUrl: mp.player.photoUrl,
                                  side: mp.side as 'A' | 'B',
                                }))}
                              />
                            ))
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-fg-3 italic">Pairings TBD</p>
                )}
              </SectionCard>
            );
          })}
        </div>
      </main>
      <BottomTabBar isAdmin={player?.isAdmin} />
    </>
  );
}
