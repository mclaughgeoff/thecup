# The Cup - Deployment Guide

Complete instructions for deploying to Replit and going live.

## Pre-Deployment Checklist

- [ ] Clone/import repository to Replit
- [ ] Set up PostgreSQL (Replit default)
- [ ] Configure environment variables (.env)
- [ ] Run database migrations and seed
- [ ] Test locally with `npm run dev`
- [ ] Verify all 16 players are in database
- [ ] Configure email (SMTP)
- [ ] Generate secure JWT secrets
- [ ] Set NEXT_PUBLIC_APP_URL to Replit URL

## Step 1: Import to Replit

1. Go to [https://replit.com](https://replit.com)
2. Click "Create" → "Import from GitHub"
3. Paste repository URL
4. Click "Import"

Replit will automatically:
- Create a PostgreSQL database
- Install Node.js dependencies (based on package.json)
- Set up the Nix environment (based on replit.nix)

## Step 2: Environment Variables

1. Click "Secrets" (lock icon) in the left sidebar
2. Add each variable from `.env.example`:

### Database
```
DATABASE_URL=postgresql://user:password@localhost:5432/cup_app
```

Replit provides this automatically. If not, create a new PostgreSQL database in the Replit console.

### JWT Secrets
Generate secure random strings:

```bash
# In terminal, run:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use for:
```
JWT_SECRET=<paste-here>
MAGIC_LINK_SECRET=<paste-here>
```

### SMTP (Email)

**Option A: Gmail** (easiest for development)
1. Enable 2-factor authentication on your Gmail account
2. Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Select "Mail" and "Windows Computer" (or custom)
4. Copy the 16-character app password

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=<16-char-app-password>
SMTP_FROM=noreply@thecupgolf.com
```

**Option B: SendGrid** (recommended for production)
1. Sign up at [https://sendgrid.com](https://sendgrid.com)
2. Create an API key
3. Use:

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<your-sendgrid-api-key>
SMTP_FROM=noreply@thecupgolf.com
```

### App URL

After Replit deploys, it gives you a URL like `https://cup-app.your-replit-username.replit.dev`:

```
NEXT_PUBLIC_APP_URL=https://cup-app.your-replit-username.replit.dev
```

## Step 3: Setup Database

1. Open the Replit terminal
2. Run:

```bash
npm install
npx prisma migrate dev
npm run prisma:seed
```

Expected output:
```
✅ Seed complete!
- Created 4 villas
- Created 16 players
- Created 8 rounds
- Created round availability records
- Created groups for all rounds
- Created teams for all rounds
```

## Step 4: Start the App

1. In Replit, click "Run" (or the play button)
2. The app will start on `http://localhost:3000`
3. A public URL will be generated (shown at top of preview)

## Step 5: First Login (Admin Setup)

1. Go to the public URL from Step 4
2. Click "Sign In to The Cup"
3. Enter Geoff's email: `mclaughlingeoffrey@gmail.com`
4. Check email for magic link (might take 10-30 seconds)
5. Click the link and you're logged in!

## Step 6: Send Invites to Players

1. After signing in, go to **Admin** (link in header)
2. Click **Send Invites**
3. Either:
   - Click "Send Invite" on each player individually
   - Click "Send All X Invites" to send to everyone

Players will receive magic links in their email within moments.

## Step 7: Configure First Round

1. Go to **Admin > Team Setup**
2. For Round 2 (first RC round), assign teams:
   - **Team 1**: Liam, Ryan, DJ, Steve C, Kevin, Paul, Tyler, Steve S
   - **Team 2**: Geoff, Dave, Charlie, Graham, John, Abe, Syng, Drew
3. Click "Save" (once UI is implemented)

## Step 8: Go Live

The app is now live! Share the public URL with all 16 players.

Players can:
- Sign in anytime with their magic link
- Update their profile (handicap, flight info)
- View the schedule
- Check the leaderboard
- Join the chat
- See housing assignments

## Ongoing Admin Tasks

### After Each Round
1. Go to **Admin > Scoring**
2. Enter match results and hole-by-hole scores
3. Leaderboard updates automatically

### Before Each Round
1. Go to **Admin > Settings**
2. Verify course, tee time, format
3. Go to **Admin > Team Setup** (if teams change)
4. Assign groups if needed

### Announcements
1. Use the Chat page to post messages
2. All players will see updates in real-time

## Troubleshooting

### "Magic link not received"
- Check spam/junk folder
- Verify SMTP settings in .env
- Try sending again (links expire after 24 hours)

### "Database connection failed"
- Check DATABASE_URL in Secrets
- Restart the app (click "Stop" then "Run")
- Run `npx prisma db push` to sync schema

### "Email sending fails"
- For Gmail: verify 2FA is enabled and you used an app password
- For SendGrid: check that API key is valid
- Check Replit logs for SMTP errors

### "Page shows 'Unauthorized'"
- Ensure you're logged in (check Auth header)
- Try clearing browser cookies
- Request a new magic link

### "Build fails on deploy"
- Ensure all secrets are set
- Run `npm install` locally to test
- Check for TypeScript errors: `npx tsc --noEmit`

## Customization

### Colors
Edit `tailwind.config.ts`:
```ts
colors: {
  'cup-green': '#1B4D3E',
  'cup-navy': '#2C3E50',
  'cup-gold': '#D4AF37',
  'cup-light': '#F5F5F5',
}
```

### Player Photos
Add headshot images to `/public/headshots/` with filename matching email (e.g., `luceca8@gmail.com.jpg`)

### Meal Info
Add meal reservations to the database, display on Housing page

### Real-time Updates
Add WebSocket with Socket.io for live scoring updates

## Monitoring

### Logs
In Replit terminal, logs show:
- Deployment status
- Database migrations
- Email sends
- API errors

### Database
Use Prisma Studio to browse data:
```bash
npx prisma studio
```

Access at `http://localhost:5555`

## Backup

Replit auto-backs up the PostgreSQL database. To export data:

```bash
pg_dump $DATABASE_URL > backup.sql
```

To restore:
```bash
psql $DATABASE_URL < backup.sql
```

## Performance

The app is optimized for mobile and will handle 16 concurrent users easily. Expected page load times:
- Home: <1s
- Dashboard: <500ms
- Schedule: <500ms
- Leaderboard: <500ms
- Chat: <200ms (real-time updates)

## Security Notes

- All auth tokens are httpOnly (not accessible from JavaScript)
- Magic links expire after 24 hours
- Passwords are never stored (magic link only)
- Admin access controlled via `isAdmin` flag in database
- HTTPS enforced in production (Replit provides SSL)
- Environment variables never exposed to frontend

## Support

For issues during deployment:
1. Check Replit console for error messages
2. Review this guide's Troubleshooting section
3. Consult the main README.md for API details
4. Contact Geoff McLaughlin (admin)

---

**Deployment time: ~10 minutes**  
**Go live time: ~2 minutes (after first sign-in)**

Once live, the app is fully functional. Additional features (drag-drop team assignment, advanced scoring UI) can be added anytime without disruption.

Good luck! ⛳
