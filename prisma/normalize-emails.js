/**
 * Lowercase every Player.email so case-sensitive unique lookups stop
 * bouncing users ("Player not found" on sign-in).
 *
 * Safe to re-run — idempotent. Skips rows where the lowercase form would
 * collide with an existing row (logs a warning).
 */
const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const players = await prisma.player.findMany({
      select: { id: true, email: true, name: true },
    });

    let changed = 0;
    let skipped = 0;

    for (const p of players) {
      const lower = p.email.trim().toLowerCase();
      if (lower === p.email) continue;

      // Would the lowercased value collide with another row?
      const collision = await prisma.player.findFirst({
        where: { email: lower, NOT: { id: p.id } },
        select: { id: true },
      });
      if (collision) {
        console.warn(
          `[normalize-emails] SKIP ${p.email} → ${lower} (collides with ${collision.id})`,
        );
        skipped++;
        continue;
      }

      await prisma.player.update({
        where: { id: p.id },
        data: { email: lower },
      });
      console.log(`[normalize-emails] ${p.name}: ${p.email} → ${lower}`);
      changed++;
    }

    console.log(
      `\n✓ normalized ${changed} row(s)` + (skipped ? `, skipped ${skipped}` : ''),
    );
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
