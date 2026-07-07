# 🌱 GAG2 Giveaways

A production-ready giveaway platform: users sign up, verify their email, enter active giveaways with one click, and winners are drawn randomly and published. A single admin (you) runs everything from a secure dashboard.

**Stack:** Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · PostgreSQL · Prisma · Auth.js (NextAuth v5) · Vercel-ready

---

## Features

**Users**
- Email + password accounts, bcrypt-hashed passwords (12 rounds)
- **Roblox login** and **Discord login** (optional, enabled by env vars)
- Email verification required before entering giveaways
- Password reset via email (hashed one-time tokens, 1h expiry)
- Profile: username, verified email, join date, entries, wins
- One-click giveaway entry; duplicate entries blocked at the DB level

**Giveaways**
- Homepage with all active giveaways (title, description, prize, live countdown, entry count, status)
- Automatic closing on expiry (Vercel cron **and** lazy close on page load)
- Public winner display on each giveaway page and a `/winners` archive

**Admin (`/admin`)**
- Create / edit / delete giveaways, end early, draw or re-draw winners
- Winner draws use a CSPRNG (`crypto.randomInt`) Fisher–Yates shuffle over **valid entries only** (not removed, user not banned)
- View all participants with entry IPs and shared-IP flags
- Search users (username / email / exact registration IP), ban / unban
- Statistics overview + suspicious signup review (3+ accounts per IP in 24h — surfaced for **manual review only**, never auto-banned)
- Full audit log of important actions

**Anti-abuse**
- Cloudflare Turnstile CAPTCHA on registration
- DB-backed rate limiting (registrations per IP, password resets, entries)
- Registration + entry IPs recorded as fraud *signals*, never the sole ban factor
- Soft-removal of suspicious entries (excluded from draws, kept for audit)

**Security**
- Zod validation on every input; Prisma parameterized queries (no SQL injection); React escaping (no XSS)
- Sessions via Auth.js JWT in secure, HttpOnly, SameSite cookies; Origin checks on state-changing endpoints
- Admin APIs re-verify the ADMIN role **against the database** on every request (JWT role is only a routing hint)
- Token hashes (SHA-256) stored instead of raw verification/reset tokens
- Security headers via `next.config.mjs`; secrets only in environment variables

---

## Quick start (local)

Requirements: Node 18.17+, a PostgreSQL database.

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
#   - Set DATABASE_URL to your Postgres connection string
#   - Set AUTH_SECRET:   openssl rand -base64 32
#   - Set ADMIN_EMAIL / ADMIN_USERNAME / ADMIN_PASSWORD (12+ chars)

# 3. Create tables and the admin account
npm run db:push
npm run db:seed

# 4. Run
npm run dev
```

Open http://localhost:3000 and log in with your admin credentials → the **Admin** link appears in the navbar.

> **Dev conveniences:** without SMTP configured, verification/reset emails are printed to the server console (copy the link from there). Without Turnstile keys, the CAPTCHA is skipped. Both must be configured in production.

## Roblox & Discord login (optional)

Both providers are enabled automatically when their env vars are set — no code changes needed.

**Discord**
1. Create an application at https://discord.com/developers/applications → OAuth2.
2. Add redirect URI `https://your-domain.com/api/auth/callback/discord` (and `http://localhost:3000/api/auth/callback/discord` for dev).
3. Set `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`.

**Roblox**
1. Create an OAuth 2.0 app at https://create.roblox.com/dashboard/credentials.
2. Enable the `openid` and `profile` scopes and add redirect URI `https://your-domain.com/api/auth/callback/roblox` (plus the localhost one for dev). Roblox may require the app to pass review before non-owners can use it.
3. Set `ROBLOX_CLIENT_ID` and `ROBLOX_CLIENT_SECRET`.

**How accounts work**
- External sign-ins create a local user linked through the `OAuthAccount` table; usernames are derived from the provider profile (made unique automatically).
- **Discord:** if Discord vouches for the email (`verified: true`) and it matches an existing account, the Discord identity is linked to that account and the email counts as verified. Unverified Discord emails still require the normal email-verification step before entering.
- **Roblox:** provides no email, so these accounts have "no email on file". They are treated as verified for giveaway entry — the identity is an authenticated Roblox account, which is exactly this site's audience, and the Roblox username is what you need for prize delivery. If you'd rather force an email anyway, flip the `verified` logic in `src/lib/oauth.ts`.
- OAuth-only accounts have no password; if they have an email, the password-reset flow doubles as "add a password".

## Deploying to Vercel

1. Push the repo to GitHub and import it in Vercel.
2. Provision Postgres (Vercel Postgres / Neon / Supabase) and set `DATABASE_URL`.
3. Set env vars in Vercel: `AUTH_SECRET`, `NEXTAUTH_URL` (your production URL), `AUTH_TRUST_HOST=true`, SMTP vars, Turnstile keys, `CRON_SECRET`.
4. First deploy, then run once from your machine against the production DB:
   ```bash
   DATABASE_URL="...prod..." npx prisma db push
   DATABASE_URL="...prod..." ADMIN_EMAIL=... ADMIN_USERNAME=... ADMIN_PASSWORD=... npx tsx prisma/seed.ts
   ```
   (For ongoing schema changes, prefer `prisma migrate deploy`.)
5. `vercel.json` registers the cron job `/api/cron/close-expired` (every 10 min). Vercel calls it with `Authorization: Bearer $CRON_SECRET` automatically.

**Recommended services:** [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile) (free CAPTCHA) and any SMTP provider (Resend SMTP, Postmark, Brevo…).

## Project structure

```
prisma/
  schema.prisma        # Users, Giveaways, Entries, Winners, AuthTokens, RateLimit, AuditLog
  seed.ts              # bootstrap admin from env
src/
  auth.config.ts       # edge-safe Auth.js config (middleware)
  middleware.ts        # /admin and /profile routing gate
  lib/                 # prisma, auth, guards, tokens, email, rate-limit, turnstile, audit, giveaways (draw), validation
  components/          # UI + client forms + admin controls
  app/
    page.tsx           # homepage (active giveaways)
    giveaways/[id]/    # public giveaway page + one-click entry
    winners/           # public winner archive
    profile/           # user profile
    login/ register/ verify-email/ forgot-password/ reset-password/
    admin/             # overview, giveaways CRUD + participants, users, audit log
    api/               # auth, entry, admin, cron endpoints
```

## Design notes & extending

- **Roles:** admins are `User.role = "ADMIN"` (set by the seed script or manually in the DB). Every admin endpoint calls `requireAdmin()`, which re-reads the DB — bans and role changes apply instantly despite JWT sessions.
- **Fair draws:** `src/lib/giveaways.ts → drawWinners()` — CSPRNG shuffle, winners persisted atomically, re-draw supported.
- **Rate limiting:** `src/lib/rate-limit.ts` is Postgres-backed (zero extra infra). Swap in Upstash Redis for high traffic without changing call sites.
- **Future features:** notifications → hook into `GIVEAWAY_DRAWN` in the draw route; more anti-fraud → add signals to the audit log and the admin overview.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `start` | Production build / serve |
| `npm run typecheck` | TypeScript check |
| `npm run db:push` | Sync schema to the database |
| `npm run db:migrate` | Create a migration (dev) |
| `npm run db:seed` | Create/refresh the admin account |
