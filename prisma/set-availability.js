/**
 * Set per-round availability for the three short-handed rounds.
 * Idempotent: uses upsert on RoundAvailability's unique (playerId, roundId).
 * For all other rounds, marks all 16 players available.
 */
const { PrismaClient } = require('@prisma/client');

// Players listed as PLAYING in each round.
// Everyone else on the roster → unavailable for that round.
const WED_PM_PLAYING = [
  'Charlie Luce',
  'Dave Romanow',
  'DJ Goldberg',
  'Geoff McLaughlin',
  'Graham Clark',
  'John Cappellucci',
  'Kevin Walsh',
  'Liam Barnes',
  'Ryan Nicholas',
  'Steve Saltzman',
];

const FRI_AM_PLAYING = [
  'Abe Guillen',
  'Dave Romanow',
  'DJ Goldberg',
  'Drew Dresser',
  'Geoff McLaughlin',
  'Kevin Walsh',
  'Liam Barnes',
  'Paul Cappellucci',
  'Steve Collura',     // user wrote "Steve Collur" — mapped
  'Steve Saltzman',
  'Syng Yu',
  'Tyler Bennett',     // user wrote "Ty Bennett" — mapped
];

const SUN_AM_PLAYING = [
  'DJ Goldberg',
  'Geoff McLaughlin',
  'John Cappellucci',
  'Kevin Walsh',
  'Liam Barnes',
  'Paul Cappellucci',
  'Ryan Nicholas',
  'Steve Collura',
];

function matchRound(rounds, day, slot) {
  const r = rounds.find((x) => x.dayOfWeek === day && x.timeSlot === slot);
  if (!r) throw new Error(`Round ${day} ${slot} not found`);
  return r;
}

function playerIdsFromNames(players, names) {
  const byName = new Map(players.map((p) => [p.name, p.id]));
  const ids = [];
  const missing = [];
  for (const n of names) {
    const id = byName.get(n);
    if (!id) missing.push(n);
    else ids.push(id);
  }
  if (missing.length) throw new Error(`Unknown players: ${missing.join(', ')}`);
  return new Set(ids);
}

async function applyRound(prisma, round, allPlayerIds, playingIds) {
  const rows = [...allPlayerIds].map((playerId) => ({
    playerId,
    roundId: round.id,
    available: playingIds.has(playerId),
  }));

  // Upsert each row. Prisma has no bulk upsert; transactions keep it safe.
  await prisma.$transaction(
    rows.map((r) =>
      prisma.roundAvailability.upsert({
        where: { playerId_roundId: { playerId: r.playerId, roundId: r.roundId } },
        update: { available: r.available },
        create: r,
      }),
    ),
  );

  const outCount = rows.filter((r) => !r.available).length;
  console.log(
    `[${round.dayOfWeek} ${round.timeSlot}]  playing ${rows.length - outCount}/${rows.length}  (out: ${outCount})`,
  );
}

(async () => {
  const prisma = new PrismaClient();
  try {
    const [players, rounds] = await Promise.all([
      prisma.player.findMany({ select: { id: true, name: true } }),
      prisma.round.findMany({
        select: { id: true, roundNumber: true, dayOfWeek: true, timeSlot: true },
        orderBy: { roundNumber: 'asc' },
      }),
    ]);

    if (players.length !== 16) {
      console.warn(
        `Warning: expected 16 players, found ${players.length}. Proceeding anyway.`,
      );
    }
    const allPlayerIds = new Set(players.map((p) => p.id));

    const wedPm = matchRound(rounds, 'Wed', 'PM');
    const friAm = matchRound(rounds, 'Fri', 'AM');
    const sunAm = matchRound(rounds, 'Sun', 'AM');

    const wedPlaying = playerIdsFromNames(players, WED_PM_PLAYING);
    const friPlaying = playerIdsFromNames(players, FRI_AM_PLAYING);
    const sunPlaying = playerIdsFromNames(players, SUN_AM_PLAYING);

    console.log('Applying short-handed rounds…');
    await applyRound(prisma, wedPm, allPlayerIds, wedPlaying);
    await applyRound(prisma, friAm, allPlayerIds, friPlaying);
    await applyRound(prisma, sunAm, allPlayerIds, sunPlaying);

    const shortHanded = new Set([wedPm.id, friAm.id, sunAm.id]);
    const fullRounds = rounds.filter((r) => !shortHanded.has(r.id));

    console.log('\nApplying full rounds (all 16 available)…');
    for (const r of fullRounds) {
      await applyRound(prisma, r, allPlayerIds, allPlayerIds);
    }

    console.log('\n✓ Availability updated.');
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
