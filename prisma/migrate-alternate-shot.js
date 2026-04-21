/**
 * One-shot data migration: remap any existing Format rows using
 * teamScoringMode = 'alternate_shot' to 'best_ball'.
 *
 * Run once after schema push: `node prisma/migrate-alternate-shot.js`.
 * Safe to re-run (idempotent).
 */
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const stale = await prisma.format.findMany({
      where: { teamScoringMode: 'alternate_shot' },
      select: { id: true, name: true, slug: true },
    });

    if (stale.length === 0) {
      console.log('[migrate-alternate-shot] No formats using alternate_shot. Nothing to do.');
      return;
    }

    for (const f of stale) {
      console.warn(
        `[migrate-alternate-shot] Remapping format "${f.name}" (${f.slug}) → best_ball`
      );
    }

    const result = await prisma.format.updateMany({
      where: { teamScoringMode: 'alternate_shot' },
      data: { teamScoringMode: 'best_ball' },
    });
    console.log(`[migrate-alternate-shot] Updated ${result.count} format row(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
