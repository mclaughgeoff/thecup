const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PHOTOS = {
  'luceca8@gmail.com': '/headshots/charlie-luce.jpg',
  'David.Goldberg@jll.com': '/headshots/dj-goldberg.jpg',
  'andrewjdresser@gmail.com': '/headshots/drew-dresser.jpg',
  'mclaughlingeoffrey@gmail.com': '/headshots/geoff-mclaughlin.jpg',
  'grteclark@gmail.com': '/headshots/graham-clark.jpg',
  'John.cappellucci.1@gmail.com': '/headshots/john-cappellucci.jpg',
  'kfwalsh12@gmail.com': '/headshots/kevin-walsh.jpg',
  'barnesliamb@gmail.com': '/headshots/liam-barnes.jpg',
  'paul.cappellucci@gmail.com': '/headshots/paul-cappellucci.jpg',
  'rjnicholas2@gmail.com': '/headshots/ryan-nicholas.jpg',
  'steven2434@gmail.com': '/headshots/steve-saltzman.jpg',
  'scollura123@gmail.com': '/headshots/steve-collura.jpg',
  'syng5201@gmail.com': '/headshots/syng-yu.jpg',
  'tyben20@gmail.com': '/headshots/tyler-bennett.jpg',
  'abe.guillen87@gmail.com': '/headshots/abe-guillen.jpg',
  'davidjromanow@gmail.com': '/headshots/dave-romanow.jpg',
};

async function main() {
  let updated = 0;
  for (const [email, photoUrl] of Object.entries(PHOTOS)) {
    const result = await prisma.player.updateMany({
      where: { email },
      data: { photoUrl },
    });
    if (result.count > 0) {
      updated += result.count;
      console.log(`✓ ${email}`);
    } else {
      console.log(`✗ no player with email ${email}`);
    }
  }
  console.log(`\nUpdated ${updated}/${Object.keys(PHOTOS).length} player photos`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
