import { requireAuth } from '@/lib/auth';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import RoundScheduleCard from '@/components/RoundScheduleCard';
import MatchupCard from '@/components/MatchupCard';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const DAY_ORDER = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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
            formatOverride: true,
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

  const todayKey = ymd(new Date());

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

        <div className="px-4 pt-4 space-y-3">
          {rounds.map((round) => {
            const isRC = round.isRyderCup;
            const playing = round.availabilities.filter((a) => a.available).length;
            const isToday = ymd(new Date(round.date)) === todayKey;

            return (
              <RoundScheduleCard
                key={round.id}
                anchorId={`day-${round.dayOfWeek}`}
                roundNumber={round.roundNumber}
                dayOfWeek={round.dayOfWeek}
                course={round.course}
                teeTime={round.teeTime}
                isRyderCup={isRC}
                playing={playing}
                totalPlayers={totalPlayers}
                defaultOpen={isToday}
              >
                {round.teeSlots.length > 0 || round.matches.length > 0 ? (
                  <div className="space-y-4 pt-3">
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
                            slotMatches.map((match) => {
                              const effectiveFormatName =
                                match.formatOverride?.name ?? round.formatRef?.name ?? round.format;
                              const effectiveFormatSlug =
                                match.formatOverride?.slug ?? round.formatRef?.slug ?? null;
                              const effectiveStrokeEntryMode =
                                match.formatOverride?.strokeEntryMode ?? round.formatRef?.strokeEntryMode;
                              return (
                                <MatchupCard
                                  key={match.id}
                                  matchNumber={match.matchNumber}
                                  teeTime={teeTime}
                                  strokeEntryMode={effectiveStrokeEntryMode}
                                  format={isRC ? effectiveFormatName : null}
                                  formatSlug={isRC ? effectiveFormatSlug : null}
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
                              );
                            })
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-fg-3 italic pt-3">Pairings TBD</p>
                )}
              </RoundScheduleCard>
            );
          })}
        </div>
      </main>
      <BottomTabBar isAdmin={player?.isAdmin} />
    </>
  );
}
