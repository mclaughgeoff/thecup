# The Cup - Quick Start Guide

Get the app running in **under 15 minutes**.

## Prerequisites

- Replit account (free at replit.com)
- Gmail account (for SMTP, or SendGrid)

## 1. Import to Replit (2 minutes)

1. Go to https://replit.com/~
2. Click **Create** → **Import from GitHub**
3. Paste: `https://github.com/yourusername/cup-app`
   - (Or fork this repo first)
4. Click **Import**
5. Wait for Replit to set up (PostgreSQL auto-installed)

## 2. Set Environment Variables (3 minutes)

Click the 🔓 **Secrets** icon (lock) in sidebar:

```
DATABASE_URL = postgresql://user:password@localhost:5432/cup_app
JWT_SECRET = (run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
MAGIC_LINK_SECRET = (run same command again for different value)
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your-email@gmail.com
SMTP_PASSWORD = (your Gmail app password)
SMTP_FROM = noreply@thecupgolf.com
NEXT_PUBLIC_APP_URL = (Replit will give you a URL, use that)
```

### Getting Gmail App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select Mail + Windows
3. Copy the 16-character password
4. Use it for `SMTP_PASSWORD`

## 3. Setup Database (3 minutes)

In the Replit terminal:

```bash
npm install
npx prisma migrate dev
npm run prisma:seed
```

You should see:
```
✅ Seed complete!
- Created 4 villas
- Created 16 players
- Created 8 rounds
...
```

## 4. Run the App (1 minute)

Click **Run** (play button) in Replit.

Replit will:
- Build the Next.js app
- Start the dev server
- Show a public URL in the preview

The URL will look like: `https://cup-app.your-username.replit.dev`

## 5. First Login (2 minutes)

1. Go to the public URL from step 4
2. Click **Sign In to The Cup**
3. Enter: `mclaughlingeoffrey@gmail.com`
4. Check email (might take 10-30 seconds)
5. Click the magic link
6. You're signed in!

## 6. Send Invites (3 minutes)

1. Click **Admin** in the header
2. Click **Send Invites**
3. Click **Send All 16 Invites**
4. All players get magic links instantly

## Done! 🎉

The app is now live. Players can:
- Sign in with their magic links
- Update their profile
- View the schedule
- Check housing
- Join the chat
- See the leaderboard

---

## Next Steps (After Launch)

1. **Set teams** — Admin > Team Setup (for each round)
2. **Enter scores** — Admin > Scoring (after each round)
3. **Share the URL** — Send to all 16 players

---

## Troubleshooting

### Magic link not received?
- Check spam folder
- Wait 30 seconds and try again
- Verify SMTP_USER and SMTP_PASSWORD in secrets

### "Database connection failed"?
- Restart the app (Stop + Run)
- Check DATABASE_URL in secrets

### Page shows "Unauthorized"?
- Clear cookies
- Request a new magic link
- Try in incognito mode

### SMTP error in logs?
- For Gmail: verify you're using an app password (not your regular password)
- For SendGrid: ensure API key is correct

---

## Important URLs

- **App:** `https://cup-app.your-username.replit.dev`
- **Admin Panel:** Same URL → click Admin link
- **Invite Link Format:** `https://cup-app.your-username.replit.dev/auth/magic-link?token=...`

---

## For More Info

- `README.md` — Full documentation
- `DEPLOYMENT.md` — Detailed setup guide
- `FEATURES.md` — What's implemented
- `PROJECT_SUMMARY.md` — Complete overview

---

**Time to Launch:** ~15 minutes  
**Time to Full Setup:** ~25 minutes  
**Status:** Ready to go live!

Good luck! ⛳
