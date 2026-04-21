const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TEE_SLOTS = {
  1: ['3:00 PM', '3:09 PM', '3:18 PM'],
  2: ['8:15 AM', '8:24 AM', '8:33 AM', '8:41 AM'],
  3: ['2:24 PM', '2:33 PM', '2:42 PM', '2:51 PM'],
  4: ['8:15 AM', '8:24 AM', '8:33 AM', '8:42 AM'],
  5: ['1:39 PM', '1:48 PM', '1:57 PM', '2:06 PM'],
  6: ['8:06 AM', '8:15 AM', '8:24 AM', '8:33 AM'],
  7: ['2:24 PM', '2:33 PM', '2:42 PM', '2:51 PM'],
  8: ['11:15 AM', '11:24 AM'],
};

async function main() {
  for (const [roundNumber, slots] of Object.entries(TEE_SLOTS)) {
    const updated = await prisma.round.updateMany({
      where: { roundNumber: Number(roundNumber) },
      data: { teeSlots: slots },
    });
    console.log(`Round ${roundNumber}: ${updated.count} updated (${slots.length} slots)`);
  }

  // Backfill: existing matches without a teeSlotIndex get slot = matchNumber - 1
  const legacy = await prisma.match.findMany({ where: { teeSlotIndex: null } });
  for (const m of legacy) {
    await prisma.match.update({
      where: { id: m.id },
      data: { teeSlotIndex: Math.max(0, m.matchNumber - 1) },
    });
  }
  if (legacy.length) console.log(`Backfilled teeSlotIndex on ${legacy.length} matches`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
