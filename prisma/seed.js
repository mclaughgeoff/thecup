const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Arrival dates: all 16 show up Wed May 13 2026. Time-of-day comes from `arrivalTime` where known.
// John and Paul have full flight info from the spreadsheet — the rest is players' to fill in via /profile.
const ARRIVAL_DATE_WED = new Date(2026, 4, 13);
const DEPARTURE_DATE_SUN = new Date(2026, 4, 17);

const PLAYERS = [
  { email: 'luceca8@gmail.com',                name: 'Charlie Luce',      handicap: 18.9, villa: '926 Cutter Court', photoUrl: '/headshots/charlie-luce.jpg',       arrivalDate: ARRIVAL_DATE_WED },
  { email: 'David.Goldberg@jll.com',           name: 'DJ Goldberg',       handicap: 5.3,  villa: '926 Cutter Court', photoUrl: '/headshots/dj-goldberg.jpg',        arrivalDate: ARRIVAL_DATE_WED },
  { email: 'andrewjdresser@gmail.com',         name: 'Drew Dresser',      handicap: 18.1, villa: '926 Cutter Court', photoUrl: '/headshots/drew-dresser.jpg',       arrivalDate: ARRIVAL_DATE_WED, arrivalTime: 'Night' },
  { email: 'mclaughlingeoffrey@gmail.com',     name: 'Geoff McLaughlin',  handicap: 16.6, villa: '828 Ketch Court',  photoUrl: '/headshots/geoff-mclaughlin.jpg',   arrivalDate: ARRIVAL_DATE_WED, isAdmin: true },
  { email: 'grteclark@gmail.com',              name: 'Graham Clark',      handicap: 19,   villa: '910 Cutter Court', photoUrl: '/headshots/graham-clark.jpg',       arrivalDate: ARRIVAL_DATE_WED },
  {
    email: 'John.cappellucci.1@gmail.com',     name: 'John Cappellucci',  handicap: 24,   villa: '910 Cutter Court', photoUrl: '/headshots/john-cappellucci.jpg',
    arrivalDate: ARRIVAL_DATE_WED, arrivalTime: '8:19 AM',  arrivalFlight: 'JetBlue 249',
    departureDate: DEPARTURE_DATE_SUN, departureTime: '9:29 AM', departureFlight: 'JetBlue 250',
  },
  { email: 'kfwalsh12@gmail.com',              name: 'Kevin Walsh',       handicap: 14,   villa: '926 Cutter Court', photoUrl: '/headshots/kevin-walsh.jpg',        arrivalDate: ARRIVAL_DATE_WED },
  { email: 'barnesliamb@gmail.com',            name: 'Liam Barnes',       handicap: 16,   villa: '828 Ketch Court',  photoUrl: '/headshots/liam-barnes.jpg',        arrivalDate: ARRIVAL_DATE_WED },
  {
    email: 'paul.cappellucci@gmail.com',       name: 'Paul Cappellucci',  handicap: 10.4, villa: '910 Cutter Court', photoUrl: '/headshots/paul-cappellucci.jpg',
    arrivalDate: ARRIVAL_DATE_WED, arrivalTime: '5:45 AM',  arrivalFlight: 'JetBlue 349',
    departureDate: DEPARTURE_DATE_SUN, departureTime: '9:29 AM', departureFlight: 'JetBlue 250',
  },
  { email: 'rjnicholas2@gmail.com',            name: 'Ryan Nicholas',     handicap: 10,   villa: '828 Ketch Court',  photoUrl: '/headshots/ryan-nicholas.jpg',      arrivalDate: ARRIVAL_DATE_WED },
  { email: 'steven2434@gmail.com',             name: 'Steve Saltzman',    handicap: 28,   villa: '910 Cutter Court', photoUrl: '/headshots/steve-saltzman.jpg',     arrivalDate: ARRIVAL_DATE_WED },
  { email: 'scollura123@gmail.com',            name: 'Steve Collura',     handicap: 7,    villa: '865 Ketch Court',  photoUrl: '/headshots/steve-collura.jpg',      arrivalDate: ARRIVAL_DATE_WED, arrivalTime: '11:30 PM' },
  { email: 'syng5201@gmail.com',               name: 'Syng Yu',           handicap: 19,   villa: '865 Ketch Court',  photoUrl: '/headshots/syng-yu.jpg',            arrivalDate: ARRIVAL_DATE_WED, arrivalTime: 'Night' },
  { email: 'tyben20@gmail.com',                name: 'Tyler Bennett',     handicap: 12.6, villa: '865 Ketch Court',  photoUrl: '/headshots/tyler-bennett.jpg',      arrivalDate: ARRIVAL_DATE_WED, arrivalTime: 'PM late' },
  { email: 'abe.guillen87@gmail.com',          name: 'Abe Guillen',       handicap: 16.6, villa: '865 Ketch Court',  photoUrl: '/headshots/abe-guillen.jpg',        arrivalDate: ARRIVAL_DATE_WED, arrivalTime: 'PM late' },
  { email: 'davidjromanow@gmail.com',          name: 'Dave Romanow',      handicap: 15,   villa: '828 Ketch Court',  photoUrl: '/headshots/dave-romanow.jpg',       arrivalDate: ARRIVAL_DATE_WED },
];

// RoundAvailability overrides (by player email → round number → available).
// Anything not listed here defaults to true for all 8 rounds.
const AVAILABILITY_OVERRIDES = {
  'andrewjdresser@gmail.com': { 2: false, 3: false, 4: false, 5: false, 6: false, 7: false }, // Drew: Thu AM–Sat PM off
  'barnesliamb@gmail.com':    { 8: false },                                                    // Liam: Sun off
};

const VILLAS = [
  { name: '828 Ketch Court', address: '828 Ketch Court, Hilton Head Island, SC 29928' },
  { name: '865 Ketch Court', address: '865 Ketch Court, Hilton Head Island, SC 29928' },
  { name: '926 Cutter Court', address: '926 Cutter Court, Hilton Head Island, SC 29928' },
  { name: '910 Cutter Court', address: '910 Cutter Court, Hilton Head Island, SC 29928' },
];

const ROUNDS = [
  { roundNumber: 1, date: new Date(2026, 4, 13, 15,  0), dayOfWeek: 'Wed', timeSlot: 'PM', course: 'Atlantic Dunes', teeTime: '3:00-3:18 PM',  isRyderCup: false, format: 'Casual',
    teeSlots: ['3:00 PM', '3:09 PM', '3:18 PM'] },
  { roundNumber: 2, date: new Date(2026, 4, 14,  8, 15), dayOfWeek: 'Thu', timeSlot: 'AM', course: 'Heron Point',    teeTime: '8:15-8:41 AM',  isRyderCup: true,  format: 'Foursomes',
    teeSlots: ['8:15 AM', '8:24 AM', '8:33 AM', '8:41 AM'] },
  { roundNumber: 3, date: new Date(2026, 4, 14, 14, 24), dayOfWeek: 'Thu', timeSlot: 'PM', course: 'Heron Point',    teeTime: '2:24-2:51 PM',  isRyderCup: true,  format: 'Four-ball',
    teeSlots: ['2:24 PM', '2:33 PM', '2:42 PM', '2:51 PM'] },
  { roundNumber: 4, date: new Date(2026, 4, 15,  8, 15), dayOfWeek: 'Fri', timeSlot: 'AM', course: 'Atlantic Dunes', teeTime: '8:15-8:42 AM',  isRyderCup: true,  format: 'Foursomes',
    teeSlots: ['8:15 AM', '8:24 AM', '8:33 AM', '8:42 AM'] },
  { roundNumber: 5, date: new Date(2026, 4, 15, 13, 39), dayOfWeek: 'Fri', timeSlot: 'PM', course: 'Atlantic Dunes', teeTime: '1:39-2:06 PM',  isRyderCup: true,  format: 'Four-ball',
    teeSlots: ['1:39 PM', '1:48 PM', '1:57 PM', '2:06 PM'] },
  { roundNumber: 6, date: new Date(2026, 4, 16,  8,  6), dayOfWeek: 'Sat', timeSlot: 'AM', course: 'Harbour Town',   teeTime: '8:06-8:33 AM',  isRyderCup: true,  format: 'Scramble',
    teeSlots: ['8:06 AM', '8:15 AM', '8:24 AM', '8:33 AM'] },
  { roundNumber: 7, date: new Date(2026, 4, 16, 14, 24), dayOfWeek: 'Sat', timeSlot: 'PM', course: 'Harbour Town',   teeTime: '2:24-2:51 PM',  isRyderCup: true,  format: 'Singles',
    teeSlots: ['2:24 PM', '2:33 PM', '2:42 PM', '2:51 PM'] },
  { roundNumber: 8, date: new Date(2026, 4, 17, 11, 15), dayOfWeek: 'Sun', timeSlot: 'AM', course: 'Heron Point',    teeTime: '11:15-11:24 AM', isRyderCup: false, format: 'Casual',
    teeSlots: ['11:15 AM', '11:24 AM'] },
];

// --- Course scorecards (from CUP_APP_UPDATE_PLAN.md §1B) ---

// Heron Point by Pete Dye (Dye tees, Par 72, 6864y, Rating 73.3, Slope 134)
// NOTE: The plan's HCP row has 19 values — the `—` at position 10 is filled with 10
// (the missing index after elimination). Confirm against physical scorecard if possible.
const HERON_POINT = {
  name: 'Heron Point',
  designer: 'Pete Dye',
  location: 'Hilton Head Island, SC',
  teeBoxes: [
    { name: 'Dye', color: '#2D2D2D', totalYards: 6864, rating: 73.3, slope: 134 },
  ],
  holes: [
    // holeNumber, par, handicapIndex, yardsByTee
    { holeNumber: 1,  par: 4, handicapIndex: 13, yards: { Dye: 400 } },
    { holeNumber: 2,  par: 4, handicapIndex: 15, yards: { Dye: 309 } },
    { holeNumber: 3,  par: 4, handicapIndex: 5,  yards: { Dye: 377 } },
    { holeNumber: 4,  par: 3, handicapIndex: 11, yards: { Dye: 233 } },
    { holeNumber: 5,  par: 4, handicapIndex: 9,  yards: { Dye: 426 } },
    { holeNumber: 6,  par: 5, handicapIndex: 3,  yards: { Dye: 544 } },
    { holeNumber: 7,  par: 3, handicapIndex: 17, yards: { Dye: 174 } },
    { holeNumber: 8,  par: 4, handicapIndex: 1,  yards: { Dye: 415 } },
    { holeNumber: 9,  par: 5, handicapIndex: 7,  yards: { Dye: 522 } },
    { holeNumber: 10, par: 4, handicapIndex: 10, yards: { Dye: 363 } },
    { holeNumber: 11, par: 5, handicapIndex: 18, yards: { Dye: 607 } },
    { holeNumber: 12, par: 4, handicapIndex: 12, yards: { Dye: 410 } },
    { holeNumber: 13, par: 3, handicapIndex: 4,  yards: { Dye: 149 } },
    { holeNumber: 14, par: 4, handicapIndex: 16, yards: { Dye: 357 } },
    { holeNumber: 15, par: 4, handicapIndex: 6,  yards: { Dye: 464 } },
    { holeNumber: 16, par: 3, handicapIndex: 2,  yards: { Dye: 220 } },
    { holeNumber: 17, par: 5, handicapIndex: 14, yards: { Dye: 485 } },
    { holeNumber: 18, par: 4, handicapIndex: 8,  yards: { Dye: 409 } },
  ],
};

// Atlantic Dunes by Davis Love III (Blue tees Par 72, 6522y; Love 7010y; White 6098y; Gold 5638y)
// Only Blue has hole-by-hole yardages in the source plan — other tees get totalYards only.
const ATLANTIC_DUNES = {
  name: 'Atlantic Dunes',
  designer: 'Davis Love III',
  location: 'Hilton Head Island, SC',
  teeBoxes: [
    { name: 'Love',  color: '#0047AB', totalYards: 7010, rating: null, slope: null },
    { name: 'Blue',  color: '#1D4ED8', totalYards: 6522, rating: null, slope: null },
    { name: 'White', color: '#F3F4F6', totalYards: 6098, rating: null, slope: null },
    { name: 'Gold',  color: '#D4A843', totalYards: 5638, rating: null, slope: null },
  ],
  holes: [
    { holeNumber: 1,  par: 4, handicapIndex: 11, yards: { Blue: 370 } },
    { holeNumber: 2,  par: 4, handicapIndex: 7,  yards: { Blue: 368 } },
    { holeNumber: 3,  par: 3, handicapIndex: 17, yards: { Blue: 175 } },
    { holeNumber: 4,  par: 5, handicapIndex: 9,  yards: { Blue: 510 } },
    { holeNumber: 5,  par: 4, handicapIndex: 13, yards: { Blue: 365 } },
    { holeNumber: 6,  par: 4, handicapIndex: 3,  yards: { Blue: 415 } },
    { holeNumber: 7,  par: 3, handicapIndex: 15, yards: { Blue: 191 } },
    { holeNumber: 8,  par: 4, handicapIndex: 5,  yards: { Blue: 384 } },
    { holeNumber: 9,  par: 5, handicapIndex: 1,  yards: { Blue: 510 } },
    { holeNumber: 10, par: 3, handicapIndex: 18, yards: { Blue: 170 } },
    { holeNumber: 11, par: 4, handicapIndex: 16, yards: { Blue: 312 } },
    { holeNumber: 12, par: 4, handicapIndex: 12, yards: { Blue: 365 } },
    { holeNumber: 13, par: 4, handicapIndex: 6,  yards: { Blue: 388 } },
    { holeNumber: 14, par: 5, handicapIndex: 8,  yards: { Blue: 484 } },
    { holeNumber: 15, par: 3, handicapIndex: 14, yards: { Blue: 176 } },
    { holeNumber: 16, par: 4, handicapIndex: 10, yards: { Blue: 355 } },
    { holeNumber: 17, par: 5, handicapIndex: 2,  yards: { Blue: 544 } },
    { holeNumber: 18, par: 4, handicapIndex: 4,  yards: { Blue: 442 } },
  ],
};

// Harbour Town Golf Links (Heritage tees, Par 71, 7131y, Rating 75.5, Slope 146)
const HARBOUR_TOWN = {
  name: 'Harbour Town',
  designer: 'Pete Dye / Jack Nicklaus',
  location: 'Hilton Head Island, SC',
  teeBoxes: [
    { name: 'Heritage', color: '#8B0000', totalYards: 7131, rating: 75.5, slope: 146 },
  ],
  holes: [
    { holeNumber: 1,  par: 4, handicapIndex: 6,  yards: { Heritage: 414 } },
    { holeNumber: 2,  par: 5, handicapIndex: 18, yards: { Heritage: 544 } },
    { holeNumber: 3,  par: 4, handicapIndex: 4,  yards: { Heritage: 465 } },
    { holeNumber: 4,  par: 3, handicapIndex: 12, yards: { Heritage: 194 } },
    { holeNumber: 5,  par: 5, handicapIndex: 14, yards: { Heritage: 561 } },
    { holeNumber: 6,  par: 4, handicapIndex: 8,  yards: { Heritage: 419 } },
    { holeNumber: 7,  par: 3, handicapIndex: 16, yards: { Heritage: 216 } },
    { holeNumber: 8,  par: 4, handicapIndex: 2,  yards: { Heritage: 467 } },
    { holeNumber: 9,  par: 4, handicapIndex: 10, yards: { Heritage: 326 } },
    { holeNumber: 10, par: 4, handicapIndex: 7,  yards: { Heritage: 435 } },
    { holeNumber: 11, par: 4, handicapIndex: 3,  yards: { Heritage: 432 } },
    { holeNumber: 12, par: 4, handicapIndex: 5,  yards: { Heritage: 426 } },
    { holeNumber: 13, par: 4, handicapIndex: 11, yards: { Heritage: 372 } },
    { holeNumber: 14, par: 3, handicapIndex: 15, yards: { Heritage: 188 } },
    { holeNumber: 15, par: 5, handicapIndex: 9,  yards: { Heritage: 584 } },
    { holeNumber: 16, par: 4, handicapIndex: 17, yards: { Heritage: 420 } },
    { holeNumber: 17, par: 3, handicapIndex: 13, yards: { Heritage: 198 } },
    { holeNumber: 18, par: 4, handicapIndex: 1,  yards: { Heritage: 470 } },
  ],
};

const COURSES = [HERON_POINT, ATLANTIC_DUNES, HARBOUR_TOWN];

// --- Ryder Cup teams (2 persistent, no members — admin assigns) ---
const RYDER_CUP_TEAMS = [
  { name: 'Team Alpha', teamNumber: 1, color: '#C41E3A' },
  { name: 'Team Bravo', teamNumber: 2, color: '#003DA5' },
];

// --- Format library ---
const FORMATS = [
  { slug: 'four-ball-match',    name: 'Four-Ball (Best Ball) Match Play',           teamSize: 2, scoringType: 'match',      teamScoringMode: 'best_ball',      handicapCombine: 'per_player',   defaultAllowance:  85, strokeEntryMode: 'per_player', sortOrder: 10, description: 'Partners play their own balls; only the lowest score per team counts per hole.' },
  { slug: 'foursomes',          name: 'Foursomes (Alternate Shot)',                 teamSize: 2, scoringType: 'match',      teamScoringMode: 'alternate_shot', handicapCombine: 'combined_sum', defaultAllowance:  50, strokeEntryMode: 'per_side',   sortOrder: 20, description: 'One ball per side; partners alternate shots until holed.' },
  { slug: 'modified-foursomes', name: 'Modified Foursomes (Modified Alternate Shot)', teamSize: 2, scoringType: 'match',    teamScoringMode: 'alternate_shot', handicapCombine: 'combined_sum', defaultAllowance:  50, strokeEntryMode: 'per_side',   sortOrder: 30, description: 'Both partners tee off, pick the best drive, then alternate shots.' },
  { slug: 'singles-match',      name: 'Singles Match Play',                         teamSize: 1, scoringType: 'match',      teamScoringMode: 'individual',     handicapCombine: 'per_player',   defaultAllowance: 100, strokeEntryMode: 'per_player', sortOrder: 40, description: 'Head-to-head: one player per side.' },
  { slug: 'two-man-scramble',   name: 'Two-Man Scramble',                           teamSize: 2, scoringType: 'match',      teamScoringMode: 'scramble',       handicapCombine: 'combined_sum', defaultAllowance:  35, strokeEntryMode: 'per_side',   sortOrder: 50, description: 'Both partners tee off, pick the best shot, all play from there.' },
  { slug: 'four-man-scramble',  name: 'Four-Man Scramble',                          teamSize: 4, scoringType: 'stroke',     teamScoringMode: 'scramble',       handicapCombine: 'combined_sum', defaultAllowance:  20, strokeEntryMode: 'per_side',   sortOrder: 60, description: 'All four partners tee off, pick the best shot, all play from there.' },
  { slug: 'bramble',            name: 'Bramble',                                    teamSize: 2, scoringType: 'match',      teamScoringMode: 'best_ball',      handicapCombine: 'per_player',   defaultAllowance:  85, strokeEntryMode: 'per_player', sortOrder: 70, description: 'Scramble off the tee, then each player plays own ball — best net score per team counts per hole.' },
  { slug: 'net-stableford',     name: 'Net Stableford Points',                      teamSize: 1, scoringType: 'stableford', teamScoringMode: 'individual',     handicapCombine: 'per_player',   defaultAllowance:  95, strokeEntryMode: 'per_player', sortOrder: 80, description: 'Points per hole vs par, adjusted for handicap.',
    stablefordConfig: { '-3': 5, '-2': 4, '-1': 3, '0': 2, '1': 1, '2': 0 } },
];

// Map the existing seeded Round.format string to a Format slug for the initial link.
const ROUND_FORMAT_SLUG = {
  'Foursomes':  'foursomes',
  'Four-ball':  'four-ball-match',
  'Scramble':   'four-man-scramble',
  'Singles':    'singles-match',
  'Casual':     null,
};

// --- Meal reservations (from CUP_APP_UPDATE_PLAN.md §3F) ---
const MEAL_RESERVATIONS = [
  // Lunches
  { date: new Date(2026, 4, 14, 12, 45), dayOfWeek: 'Thu', mealType: 'lunch',  time: '12:45 PM', restaurant: "Fraser's Tavern", notes: '1.9hr break before 2:24 PM tee',  confirmed: true  },
  { date: new Date(2026, 4, 15, 12, 45), dayOfWeek: 'Fri', mealType: 'lunch',  time: '12:45 PM', restaurant: "Fraser's Tavern", notes: '1.4hr break before 1:39 PM tee',  confirmed: true  },
  { date: new Date(2026, 4, 16, 12, 45), dayOfWeek: 'Sat', mealType: 'lunch',  time: 'TBD',      restaurant: 'Links',            notes: 'Tentative — 1.4hr break before 2:24 PM tee', confirmed: false },
  // Dinners
  { date: new Date(2026, 4, 14, 20,  0), dayOfWeek: 'Thu', mealType: 'dinner', time: '8:00 PM',  restaurant: 'Coast',            headcount: 16, confirmed: true },
  { date: new Date(2026, 4, 15, 19, 15), dayOfWeek: 'Fri', mealType: 'dinner', time: '7:15 PM',  restaurant: 'Links',            headcount: 16, confirmed: true },
  { date: new Date(2026, 4, 16, 19, 45), dayOfWeek: 'Sat', mealType: 'dinner', time: '7:45 PM',  restaurant: 'Quarterdeck',      headcount: 16, confirmed: true },
];

async function main() {
  console.log('Seeding database...');

  // Delete existing data (dependency order)
  await prisma.magicLink.deleteMany({});
  await prisma.chatMessage.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.score.deleteMany({});
  await prisma.matchPlayer.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.ryderCupTeamMember.deleteMany({});
  await prisma.ryderCupTeam.deleteMany({});
  await prisma.roundAvailability.deleteMany({});
  await prisma.round.deleteMany({});
  await prisma.holeYardage.deleteMany({});
  await prisma.hole.deleteMany({});
  await prisma.teeBox.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.format.deleteMany({});
  await prisma.mealReservation.deleteMany({});
  await prisma.player.deleteMany({});
  await prisma.villa.deleteMany({});

  // Villas
  const createdVillas = await Promise.all(
    VILLAS.map(villa => prisma.villa.create({ data: villa }))
  );
  console.log(`Created ${createdVillas.length} villas`);

  // Players
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
          arrivalDate: player.arrivalDate ?? null,
          arrivalTime: player.arrivalTime ?? null,
          arrivalFlight: player.arrivalFlight ?? null,
          arrivalAirport: player.arrivalAirport ?? null,
          departureDate: player.departureDate ?? null,
          departureTime: player.departureTime ?? null,
          departureFlight: player.departureFlight ?? null,
          departureAirport: player.departureAirport ?? null,
        },
      });
    })
  );
  console.log(`Created ${createdPlayers.length} players`);

  // Courses (with tee boxes + holes + hole yardages)
  const coursesByName = {};
  const teeBoxesByCourseAndName = {};
  for (const c of COURSES) {
    const course = await prisma.course.create({
      data: {
        name: c.name,
        designer: c.designer,
        location: c.location,
      },
    });
    coursesByName[c.name] = course;

    // Tee boxes
    teeBoxesByCourseAndName[c.name] = {};
    for (const tb of c.teeBoxes) {
      const teeBox = await prisma.teeBox.create({
        data: {
          courseId: course.id,
          name: tb.name,
          color: tb.color ?? null,
          totalYards: tb.totalYards,
          rating: tb.rating ?? null,
          slope: tb.slope ?? null,
        },
      });
      teeBoxesByCourseAndName[c.name][tb.name] = teeBox;
    }

    // Holes + yardages
    for (const h of c.holes) {
      const hole = await prisma.hole.create({
        data: {
          courseId: course.id,
          holeNumber: h.holeNumber,
          par: h.par,
          handicapIndex: h.handicapIndex,
        },
      });
      for (const [teeName, yards] of Object.entries(h.yards)) {
        const teeBox = teeBoxesByCourseAndName[c.name][teeName];
        if (!teeBox) continue; // skip unknown tees
        await prisma.holeYardage.create({
          data: {
            holeId: hole.id,
            teeBoxId: teeBox.id,
            yards,
          },
        });
      }
    }
  }
  console.log(`Created ${COURSES.length} courses with tee boxes & scorecards`);

  // Formats (seed library)
  const createdFormats = {};
  for (const f of FORMATS) {
    const row = await prisma.format.create({ data: f });
    createdFormats[f.slug] = row;
  }
  console.log(`Created ${FORMATS.length} formats`);

  // Rounds — link to course + format
  const roundCourseTeeBox = {
    'Heron Point':    'Dye',
    'Atlantic Dunes': 'Blue',
    'Harbour Town':   'Heritage',
  };
  const createdRounds = await Promise.all(
    ROUNDS.map(round => {
      const course = coursesByName[round.course];
      const formatSlug = ROUND_FORMAT_SLUG[round.format] ?? null;
      const formatRow = formatSlug ? createdFormats[formatSlug] : null;
      return prisma.round.create({
        data: {
          ...round,
          courseId: course?.id ?? null,
          activeTeeBox: roundCourseTeeBox[round.course] ?? null,
          formatId: formatRow?.id ?? null,
        },
      });
    })
  );
  console.log(`Created ${createdRounds.length} rounds`);

  // Round availabilities — default true everywhere, apply per-player overrides
  for (const player of createdPlayers) {
    const override = AVAILABILITY_OVERRIDES[player.email] ?? {};
    for (const round of createdRounds) {
      const available = override[round.roundNumber] ?? true;
      await prisma.roundAvailability.create({
        data: {
          playerId: player.id,
          roundId: round.id,
          available,
        },
      });
    }
  }
  console.log('Created round availability records');

  // Ryder Cup teams — seeded with a sample roster so the scoring UI is usable out of the box.
  // Admin can reshuffle later via /admin/ryder-cup.
  const SAMPLE_ROSTER = {
    1: [ // Team Alpha
      'mclaughlingeoffrey@gmail.com', // Geoff
      'David.Goldberg@jll.com',       // DJ
      'andrewjdresser@gmail.com',     // Drew
      'John.cappellucci.1@gmail.com', // John
      'kfwalsh12@gmail.com',          // Kevin
      'paul.cappellucci@gmail.com',   // Paul
      'steven2434@gmail.com',         // Steve S
      'tyben20@gmail.com',            // Ty
    ],
    2: [ // Team Bravo
      'luceca8@gmail.com',            // Charlie
      'grteclark@gmail.com',          // Graham
      'barnesliamb@gmail.com',        // Liam
      'rjnicholas2@gmail.com',        // Ryan
      'scollura123@gmail.com',        // Steve C
      'syng5201@gmail.com',           // Syng
      'abe.guillen87@gmail.com',      // Abe
      'davidjromanow@gmail.com',      // Dave
    ],
  };
  const createdTeams = {};
  for (const team of RYDER_CUP_TEAMS) {
    const row = await prisma.ryderCupTeam.create({ data: team });
    createdTeams[team.teamNumber] = row;
    for (const email of SAMPLE_ROSTER[team.teamNumber] ?? []) {
      const p = createdPlayers.find(pl => pl.email === email);
      if (p) {
        await prisma.ryderCupTeamMember.create({
          data: { teamId: row.id, playerId: p.id },
        });
      }
    }
  }
  console.log(`Created ${RYDER_CUP_TEAMS.length} Ryder Cup teams with sample rosters`);

  // Example match on Round 2 (Thu AM, Foursomes) — Geoff & DJ vs Charlie & Graham.
  const round2 = createdRounds.find(r => r.roundNumber === 2);
  const byEmail = (e) => createdPlayers.find(p => p.email === e);
  const alpha = createdTeams[1];
  const bravo = createdTeams[2];
  if (round2 && alpha && bravo) {
    const geoff   = byEmail('mclaughlingeoffrey@gmail.com');
    const dj      = byEmail('David.Goldberg@jll.com');
    const charlie = byEmail('luceca8@gmail.com');
    const graham  = byEmail('grteclark@gmail.com');
    if (geoff && dj && charlie && graham) {
      await prisma.match.create({
        data: {
          roundId: round2.id,
          matchNumber: 1,
          teeSlotIndex: 0,
          teamAId: alpha.id,
          teamBId: bravo.id,
          players: {
            create: [
              { playerId: geoff.id,   side: 'A' },
              { playerId: dj.id,      side: 'A' },
              { playerId: charlie.id, side: 'B' },
              { playerId: graham.id,  side: 'B' },
            ],
          },
        },
      });
      console.log('Created example match: Round 2 Match 1 (Foursomes)');
    }
  }

  // Meal reservations
  for (const meal of MEAL_RESERVATIONS) {
    await prisma.mealReservation.create({ data: meal });
  }
  console.log(`Created ${MEAL_RESERVATIONS.length} meal reservations`);

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
