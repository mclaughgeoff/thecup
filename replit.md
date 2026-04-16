# The Cup - Annual Ryder Cup Golf Trip App

## Overview
A full-stack Next.js app for managing an annual Ryder Cup golf trip. Includes player management, match scheduling, scoring, housing/villa assignments, chat, and magic-link authentication.

## Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL via Prisma ORM (Replit built-in database)
- **Auth**: Magic link (JWT-based, no passwords)
- **Email**: Nodemailer (SMTP)
- **Styling**: Tailwind CSS
- **State**: Zustand

## Project Structure
```
app/             - Next.js App Router pages & API routes
  api/           - Server-side API endpoints
  admin/         - Admin dashboard pages
  auth/          - Authentication pages
  chat/          - Chat feature
  dashboard/     - Main dashboard
  housing/       - Villa assignment
  leaderboard/   - Scoring leaderboard
  players/       - Player profiles
  profile/       - User profile
  schedule/      - Round schedule
components/      - Shared React components
lib/             - Server utilities (auth, email, utils)
prisma/          - Schema and seed script
public/          - Static assets
```

## Environment Variables
Set in Replit Secrets:
- `DATABASE_URL` — Replit PostgreSQL connection string (auto-managed)
- `JWT_SECRET` — Secret for signing JWT tokens
- `MAGIC_LINK_SECRET` — Secret for magic link tokens

Set as env vars:
- `AUTH_TOKEN_EXPIRY` — Token expiry in ms (604800000 = 7 days)
- `SMTP_PORT` — SMTP port (587)
- `NODE_ENV` — development or production

Optional (for email sending):
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`
- `NEXT_PUBLIC_APP_URL`

## Dev Commands
```bash
npm run dev       # Start dev server on port 5000
npm run build     # Build for production
npm run start     # Start production server on port 5000
npx prisma db push   # Sync schema to database
npx prisma generate  # Regenerate Prisma client
node prisma/seed.js  # Seed initial data
```

## Replit Notes
- Dev server runs on port 5000 (required for Replit preview)
- `LD_LIBRARY_PATH` is set to empty string to prevent OpenSSL version conflict from legacy replit.nix
- Database schema managed via `prisma db push` (no migration files)
- All secrets managed via Replit Secrets tab
