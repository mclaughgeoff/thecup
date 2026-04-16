const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PLAYERS = [
  { email: 'luceca8@gmail.com', name: 'Charlie Luce', handicap: 18.9, villa: '926 Cutter Court', photoUrl: '/headshots/charlie-luce.jpg' },
  { email: 'David.Goldberg@jll.com', name: 'DJ Goldberg', handicap: 5.3, villa: '926 Cutter Court', photoUrl: '/headshots/dj-goldberg.jpg' },
  { email: 'andrewjdresser@gmail.com', name: 'Drew Dresser', handicap: 18.1, villa: '926 Cutter Court', photoUrl: '/headshots/drew-dresser.jpg' },
  { email: 'mclaughlingeoffrey@gmail.com', name: 'Geoff McLaughlin', handicap: 16.6, villa: '828 Ketch Court', isAdmin: true, photoUrl: '/headshots/geoff-mclaughlin.jpg' },
  { email: 'grteclark@gmail.com', name: 'Graham Clark', handicap: 19, villa: '910 Cutter Court', photoUrl: '/headshots/graham-clark.jpg' },
  { email: 'John.cappellucci.1@gmail.com', name: 'John Cappellucci', handicap: 24, villa: '910 Cutter Court', photoUrl: '/headshots/john-cappellucci.jpg' },
  { email: 'kfwalsh12@gmail.com', name: 'Kevin Walsh', handicap: 14, villa: '926 Cutter Court', photoUrl: '/headshots/kevin-walsh.jpg' },
  { email: 'barnesliamb@gmail.com', name: 'Liam Barnes', handicap: 16, villa: '828 Ketch Court', photoUrl: '/headshots/liam-barnes.jpg' },
  { email: 'paul.cappellucci@gmail.com', name: 'Paul Cappellucci', handicap: 10.4, villa: '910 Cutter Court', photoUrl: '/headshots/paul-cappellucci.jpg' },
  { email: 'rjnicholas2@gmail.com', name: 'Ryan Nicholas', handicap: 10, villa: '828 Ketch Court', photoUrl: '/headshots/ryan-nicholas.jpg' },
  { email: 'steven2434@gmail.com', name: 'Steve Saltzman', handicap: 28, villa: '910 Cutter Court', photoUrl: '/headshots/steve-saltzman.jpg' },
  { email: 'scollura123@gmail.com', name: 'Steve Collura', handicap: 7, villa: '865 Ketch Court', photoUrl: '/headshots/steve-collura.jpg' },
  { email: 'syng5201@gmail.com', name: 'Syng Yu', handicap: 19, villa: '865 Ketch Court', photoUrl: '/headshots/syng-yu.jpg' },
  { email: 'tyben20@gmail.com', name: 'Tyler Bennett', handicap: 12.6, villa: '865 Ketch Court', photoUrl: '/headshots/tyler-bennett.jpg' },
  { email: 'abe.guillen87@gmail.com', name: 'Abe Guillen', handicap: 16.6, villa: '865 Ketch Court', photoUrl: '/headshots/abe-guillen.jpg' },
  { email: 'davidjromanow@gmail.com', name: 'Dave Romanow', handicap: 15, villa: '828 Ketch Court', photoUrl: '/headshots/dave-romanow.jpg' },
];

const VILLAS = [
  { name: '828 Ketch Court', address: '828 Ketch Court, Hilton Head Island, SC 29928' },
  { name: '865 Ketch Court', address: '865 Ketch Court, Hilton Head Island, SC 29928' },
  { name: '926 Cutter Court', address: '926 Cutter Court, Hilton Head Island, SC 29928' },
  { name: '910 Cutter Court', address: '910 Cutter Court, Hilton Head Island, SC 29928' },
];

const ROUNDS = [
  { roundNumber: 1, date: new Date(2026, 4, 13, 14, 0), dayOfWeek: 'Wed', timeSlot: 'PM', course: 'TBD', teeTime: 'TBD', isRyderCup: false, format: 'Casual' },
  { roundNumber: 2, date: new Date(2026, 4, 14, 8, 15), dayOfWeek: 'Thu', timeSlot: 'AM', course: 'Heron Point', teeTime: '8:15-8:41 AM', isRyderCup: true, format: 'Foursomes' },
  { roundNumber: 3, date: new Date(2026, 4, 14, 14, 24), dayOfWeek: 'Thu', timeSlot: 'PM', course: 'Heron Point', teeTime: '2:24-2:51 PM', isRyderCup: true, format: 'Four-ball' },
  { roundNumber: 4, date: new Date(2026, 4, 15, 8, 15), dayOfWeek: 'Fri', timeSlot: 'AM', course: 'Atlantic Dunes', teeTime: '8:15-8:42 AM', isRyderCup: true, format: 'Foursomes' },
  { roundNumber: 5, date: new Date(2026, 4, 15, 13, 39), dayOfWeek: 'Fri', timeSlot: 'PM', course: 'Atlantic Dunes', teeTime: '1:39-2:06 PM', isRyderCup: true, format: 'Four-ball' },
  { roundNumber: 6, date: new Date(2026, 4, 16, 8, 6), dayOfWeek: 'Sat', timeSlot: 'AM', course: 'Harbour Town', teeTime: '8:06-8:33 AM', isRyderCup: true, format: 'Scramble' },
  { roundNumber: 7, date: new Date(2026, 4, 16, 14, 24), dayOfWeek: 'Sat', timeSlot: 'PM', course: 'Harbour Town', teeTime: '2:24-2:51 PM', isRyderCup: true, format: 'Singles' },
  { roundNumber: 8, date: new Date(2026, 4, 17, 8, 0), dayOfWeek: 'Sun', timeSlot: 'AM', course: 'TBD', teeTime: 'TBD', isRyderCup: false, format: 'Casual' },
];

async function main() {
  console.log('Seeding database...');

  // Delete existing data
  await prisma.magicLink.deleteMany({});
  await prisma.chatMessage.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.score.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.roundAvailability.deleteMany({});
  await prisma.round.deleteMany({});
  await prisma.player.deleteMany({});
  await prisma.villa.deleteMany({});

  // Create villas
  const createdVillas = await Promise.all(
    VILLAS.map(villa => prisma.villa.create({ data: villa }))
  );
  console.log(`Created ${createdVillas.length} villas`);

  // Create players
  const createdPlayers = await Promise.all(
    PLAYERS.map(player => {
      const villa = createdVillas.find(v => v.name === player.villa);
      return prisma.player.create({
        data: {
          email: player.email,
          name: player.name,
          handicap: player.handicap,
          isAdmin: player.isAdmin || false,
          villaId: villa?.id,
          photoUrl: player.photoUrl,
        },
      });
    })
  );
  console.log(`Created ${createdPlayers.length} players`);

  // Create rounds
  const createdRounds = await Promise.all(
    ROUNDS.map(round => prisma.round.create({ data: round }))
  );
  console.log(`Created ${createdRounds.length} rounds`);

  // Create round availabilities (all players available for all rounds by default)
  for (const player of createdPlayers) {
    for (const round of createdRounds) {
      await prisma.roundAvailability.create({
        data: {
          playerId: player.id,
          roundId: round.id,
          available: true,
        },
      });
    }
  }
  console.log(`Created round availability records`);

  // Create groups (4 groups per round)
  for (const round of createdRounds) {
    for (let i = 1; i <= 4; i++) {
      await prisma.group.create({
        data: {
          roundId: round.id,
          groupNumber: i,
        },
      });
    }
  }
  console.log(`Created groups for all rounds`);

  // Create initial teams (placeholder)
  for (const round of createdRounds) {
    await prisma.team.create({
      data: {
        roundId: round.id,
        teamNumber: 1,
      },
    });
    await prisma.team.create({
      data: {
        roundId: round.id,
        teamNumber: 2,
      },
    });
  }
  console.log(`Created teams for all rounds`);

  console.log('✅ Seed complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
