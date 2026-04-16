# The Cup - Ryder Cup Golf Trip App

A complete full-stack web application for managing an annual 16-player Ryder Cup-style golf trip at Sea Pines, Hilton Head.

## Features

- **Magic Link Authentication** — Secure email-based sign-in
- **Player Profiles** — Manage handicaps, travel info, and availability
- **Schedule & Tee Times** — View courses, times, and group assignments
- **Live Scoring** — Real-time match results and leaderboard
- **Ryder Cup Leaderboard** — Team standings, per-round breakdown
- **Team Chat** — Group messaging and announcements
- **Housing & Travel** — Villa assignments, flight info
- **Admin Dashboard** — Manage invites, teams, scoring, and settings

## Tech Stack

- **Next.js 14** (App Router)
- **PostgreSQL** + **Prisma ORM**
- **Tailwind CSS**
- **Node.js / TypeScript**
- **Magic Link Auth** (JWT in httpOnly cookies)

## Deployment: Replit

This app is fully configured for Replit deployment.

### Quick Start

1. **Fork/Import to Replit**
   - Go to [Replit](https://replit.com) and import this repository

2. **Set Environment Variables**
   - Create `.env` in the project root (copy from `.env.example`)
   - Set up PostgreSQL connection string (Replit provides one)
   - Configure SMTP credentials (Gmail or SendGrid recommended)
   - Generate secure JWT secrets

   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/cup_app"
   JWT_SECRET="generate-a-random-secret"
   MAGIC_LINK_SECRET="generate-another-random-secret"
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASSWORD="your-app-specific-password"
   SMTP_FROM="noreply@thecupgolf.com"
   NEXT_PUBLIC_APP_URL="https://your-replit-url.replit.dev"
   ```

3. **Install Dependencies & Setup Database**
   ```bash
   npm install
   npx prisma migrate dev
   npm run prisma:seed
   ```

4. **Run the App**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd cup-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database and email credentials
   ```

4. **Setup database**
   ```bash
   npx prisma migrate dev
   npm run prisma:seed
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000`

## Pre-Seeded Data

The seed script pre-populates the database with:

- **16 Players** — All names, emails, handicaps, and villa assignments
- **8 Rounds** — Complete schedule with courses, tee times, formats
- **4 Villas** — Housing assignments (4 players per villa)
- **Groups & Teams** — Empty groups/teams ready for assignment

### Players

1. Charlie Luce (18.9 HCP)
2. DJ Goldberg (5.3 HCP)
3. Drew Dresser (18.1 HCP)
4. Geoff McLaughlin (16.6 HCP) — **ADMIN**
5. Graham Clark (19 HCP)
6. John Cappellucci (24 HCP)
7. Kevin Walsh (14 HCP)
8. Liam Barnes (16 HCP)
9. Paul Cappellucci (10.4 HCP)
10. Ryan Nicholas (10 HCP)
11. Steve Saltzman (28 HCP)
12. Steve Collura (7 HCP)
13. Syng Yu (19 HCP)
14. Tyler Bennett (12.6 HCP)
15. Abe Guillen (16.6 HCP)
16. Dave Romanow (unknown HCP)

### Villas

- **828 Ketch Court** — Geoff, Liam, Ryan, Dave
- **865 Ketch Court** — Steve C, Tyler, Abe, Syng
- **926 Cutter Court** — Charlie, DJ, Drew, Kevin
- **910 Cutter Court** — John, Paul, Graham, Steve S

### Schedule

| Round | Day | Time | Course | Format | RC? |
|-------|-----|------|--------|--------|-----|
| 1 | Wed | PM | TBD | Casual | No |
| 2 | Thu | 8:15 AM | Heron Point | Foursomes | Yes |
| 3 | Thu | 2:24 PM | Heron Point | Four-ball | Yes |
| 4 | Fri | 8:15 AM | Atlantic Dunes | Foursomes | Yes |
| 5 | Fri | 1:39 PM | Atlantic Dunes | Four-ball | Yes |
| 6 | Sat | 8:06 AM | Harbour Town | Scramble | Yes |
| 7 | Sat | 2:24 PM | Harbour Town | Singles | Yes |
| 8 | Sun | 8:00 AM | TBD | Casual | No |

## Usage

### First Time: Admin Setup

1. **Sign in** — Use your (Geoff's) email: `mclaughlingeoffrey@gmail.com`
2. **Go to Admin** — Click the Admin link in the header
3. **Send Invites** — Send magic links to all 16 players (or individually)
4. **Set Teams** — Assign players to teams for each round
5. **Configure Scoring** — Enter match results as rounds happen

### Player Workflow

1. **Receive Email** — Player gets magic link in their inbox
2. **Sign In** — Click the link, they're logged in for 7 days
3. **Update Profile** — Add handicap, flight info, availability
4. **View Schedule** — See which rounds they're in
5. **Check Leaderboard** — Track team standings
6. **Chat** — Message the group

## File Structure

```
cup-app/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── chat/              # Chat messages
│   │   ├── players/           # Player profile
│   │   └── admin/             # Admin invite/settings
│   ├── admin/                 # Admin pages
│   │   ├── page.tsx           # Dashboard
│   │   ├── invites/           # Send invites
│   │   ├── teams/             # Team setup
│   │   ├── scoring/           # Scoring entry
│   │   └── settings/          # Round settings
│   ├── auth/                  # Auth pages
│   │   ├── request-link/      # Request magic link
│   │   └── magic-link/        # Verify link
│   ├── dashboard/             # Main dashboard
│   ├── schedule/              # Schedule view
│   ├── leaderboard/           # Live leaderboard
│   ├── players/               # Player roster
│   ├── profile/               # Edit profile
│   ├── housing/               # Housing info
│   ├── chat/                  # Team chat
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home page
├── components/                # Shared components
│   ├── Header.tsx             # Navigation header
│   └── PlayerAvatar.tsx       # Player avatar component
├── lib/
│   ├── auth.ts                # Auth utilities
│   ├── email.ts               # Email sending
│   └── utils.ts               # Helper functions
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.js                # Seed script
├── public/                    # Static assets
├── .env.example               # Environment template
├── .replit                    # Replit config
├── replit.nix                 # Nix dependencies
├── next.config.js             # Next.js config
├── tailwind.config.ts         # Tailwind config
├── postcss.config.js          # PostCSS config
├── tsconfig.json              # TypeScript config
└── package.json               # Dependencies
```

## Key Concepts

### Authentication

- **Magic Links** — No passwords. Players get a 24-hour sign-in link via email.
- **JWT Sessions** — Secure, httpOnly cookies that last 7 days.
- **Admin Only** — Geoff (admin) can send invites and manage the app.

### Database Schema

- **Players** — Name, email, handicap, travel info, villa assignment
- **Rounds** — 8 scheduled rounds with course, tee time, format, RC toggle
- **Teams** — 2 teams per round, 8 players per team
- **Matches** — 4 groups per round, 1+ matches per group
- **Scores** — Hole-by-hole scoring per match
- **Housing** — 4 villas, 4 players per villa
- **Chat** — Group messaging

### Styling

- **Dark Green/Navy/Gold** color palette
- **Mobile-first** responsive design
- **Tailwind CSS** for all styling
- **Broadcast-quality** leaderboard and scoreboard

## Admin Tasks

### Inviting Players

1. Go to **Admin > Send Invites**
2. Click "Send Invite" for each player, or "Send All" to invite everyone
3. Players receive magic links in their email

### Setting Teams

1. Go to **Admin > Team Setup**
2. For each round, assign 8 players to Team 1 and 8 to Team 2
3. Players are automatically grouped into foursomes/pairs

### Entering Scores

1. Go to **Admin > Scoring**
2. For each match, enter hole-by-hole scores or final result
3. Leaderboard updates in real-time

### Managing Rounds

1. Go to **Admin > Settings**
2. Toggle each round as "Ryder Cup" or "Casual"
3. Update course, tee time, format
4. Save changes

## Email Setup

### Gmail (Recommended for Development)

1. Enable 2-factor authentication
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use the 16-character password in `SMTP_PASSWORD`

### SendGrid (Recommended for Production)

1. Sign up at [SendGrid](https://sendgrid.com)
2. Create an API key
3. Use `sendgrid` in SMTP_HOST, your API key in SMTP_PASSWORD

## Troubleshooting

### "Database connection failed"

- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running (Replit handles this)
- Run `npx prisma db push` to create tables

### "Magic link expired"

- Links expire after 24 hours
- Players can request a new link on the sign-in page

### "Email not received"

- Check spam/junk folder
- Verify SMTP credentials in `.env`
- Check app logs for SMTP errors

### "Build fails"

- Run `npm install` to ensure all dependencies are present
- Check for TypeScript errors: `npx tsc --noEmit`
- Clear `.next/` folder: `rm -rf .next`

## API Endpoints

### Authentication

- `POST /api/auth/request-link` — Request magic link
- `POST /api/auth/verify-magic-link` — Verify & sign in
- `GET /api/auth/me` — Get current user
- `POST /api/auth/logout` — Logout

### Players

- `GET /api/players` — List all players
- `PUT /api/players/profile` — Update own profile

### Chat

- `GET /api/chat/messages` — Get all messages
- `POST /api/chat/messages` — Send a message

### Admin

- `POST /api/admin/send-invite` — Send invite to 1 player
- `POST /api/admin/send-invites-bulk` — Send invites to multiple players

## Next Steps

1. **Deploy to Replit** — Follow the Quick Start above
2. **Customize Branding** — Update colors, logos, messaging
3. **Add Player Photos** — Upload headshots to `/public/headshots/`
4. **Configure Meals** — Add restaurant details and reservations
5. **Real-time Updates** — Add WebSocket or polling for live scoring

## License

Private project for The Cup. All rights reserved.

## Support

For questions or issues, contact Geoff McLaughlin (admin@thecupgolf.com).

---

**Made with ⛳ for the boys.** May 13–17, 2026. Sea Pines. 🏌️
