/**
 * One-shot handicap update. Idempotent — re-running with the same values is a no-op.
 * Matches by name (case-insensitive), with a small alias map for "Ty Bennett".
 */
const { PrismaClient } = require('@prisma/client');

const HANDICAPS = [
  ['DJ Goldberg',       5.3],
  ['Liam Barnes',       16],
  ['Ryan Nicholas',     10],
  ['Paul Cappellucci',  10.4],
  ['Syng Yu',           19],
  ['Geoff McLaughlin',  17],
  ['John Cappellucci',  24],
  ['Dave Romanow',      30],
  ['Charlie Luce',      18.9],
  ['Steve Collura',     7],
  ['Drew Dresser',      18.1],
  ['Abe Guillen',       16.6],
  ['Ty Bennett',        12.6], // DB stores "Tyler Bennett"
  ['Kevin Walsh',       14],
  ['Graham Clark',      19],
  ['Steve Saltzman',    28],
];

const NAME_ALIASES = {
  'Ty Bennett': 'Tyler Bennett',
};

(async () => {
  const prisma = new PrismaClient();
  try {
    const players = await prisma.player.findMany({
      select: { id: true, name: true, handicap: true },
    });
    const byName = new Map(players.map((p) => [p.name.toLowerCase(), p]));

    let updated = 0;
    let skipped = 0;
    const missing = [];

    for (const [inputName, hcp] of HANDICAPS) {
      const dbName = NAME_ALIASES[inputName] ?? inputName;
      const row = byName.get(dbName.toLowerCase());
      if (!row) {
        missing.push(inputName);
        continue;
      }
      if (row.handicap === hcp) {
        skipped++;
        continue;
      }
      await prisma.player.update({
        where: { id: row.id },
        data: { handicap: hcp },
      });
      console.log(`  ${row.name.padEnd(20)} ${String(row.handicap).padStart(5)} → ${hcp}`);
      updated++;
    }

    console.log(`\n✓ updated ${updated}, unchanged ${skipped}`);
    if (missing.length) {
      console.warn(`\n⚠ not found in DB: ${missing.join(', ')}`);
    }
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
