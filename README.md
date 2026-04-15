# Invoice Generator

Single-user personal invoice generator. Built with Next.js 16, Postgres (local / Neon / Vercel Postgres), Prisma 7, NextAuth v5, Resend, Vercel Blob, and react-pdf.

## Features
- Clients & products catalogs
- Invoices with tax (basis points) and discounts, multi-currency
- PDF generation (react-pdf, server-rendered)
- Email delivery (Resend) with PDF attachment
- Payment tracking (full or partial)
- Recurring invoice schedules (daily cron)
- Auth via email magic link, restricted to `ALLOWED_EMAIL`

## Local dev

### Prerequisites
- Node 20+
- Docker (for local Postgres)

### Setup
```bash
# 1. Start Postgres
docker compose up -d

# 2. Install deps
npm install

# 3. Copy env and fill in what you need
cp .env.example .env
# Required for login/email: AUTH_RESEND_KEY, RESEND_FROM, ALLOWED_EMAIL
# Required for send-invoice flow: BLOB_READ_WRITE_TOKEN

# 4. Generate AUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Paste the output into AUTH_SECRET in .env

# 5. Apply migrations
npm run db:migrate

# 6. Run dev server
npm run dev
```

Visit http://localhost:3000. First-time you log in, go to `/settings` and fill in your business profile.

### Scripts
- `npm run dev` — dev server (Turbopack)
- `npm run build` / `npm start` — production build & serve
- `npm run typecheck` — tsc
- `npm test` — unit tests (Vitest)
- `npm run test:e2e` — Playwright smoke
- `npm run db:migrate` / `db:push` / `db:studio` / `db:seed` / `db:migrate:deploy`

## Deploy to Vercel

1. **Database:** create a Neon project or a Vercel Postgres store. Copy the connection URL.
2. **Blob storage:** enable Vercel Blob in the project. Copy `BLOB_READ_WRITE_TOKEN`.
3. **Email:** Resend account → verify a domain → generate API key (`AUTH_RESEND_KEY`).
4. **Set env vars** in Vercel project settings:
   - `DATABASE_URL`
   - `AUTH_SECRET` (generate with the same one-liner as above)
   - `AUTH_RESEND_KEY`
   - `RESEND_FROM` (must be on your verified Resend domain)
   - `ALLOWED_EMAIL` (the one email allowed to sign in)
   - `BLOB_READ_WRITE_TOKEN`
   - `CRON_SECRET` (random string; used by Vercel Cron)
   - `NEXT_PUBLIC_APP_URL` (e.g. `https://invoicer.yourdomain.com`)
5. **Deploy.** On first deploy, run migrations once:
   ```bash
   npx vercel env pull .env.production
   npm run db:migrate:deploy
   ```
   (Or use a Vercel build step that runs `prisma migrate deploy` before `next build`.)
6. **Cron** is wired via `vercel.json` — Vercel runs `/api/cron/recurring` daily at 02:00 UTC.

### Production Postgres adapter (optional)
For Neon in a serverless runtime, swap the driver adapter in `src/lib/db.ts` from `@prisma/adapter-pg` to `@prisma/adapter-neon` for lower cold-start latency. Not required for Vercel Postgres (pg is fine).

## Architecture
- `src/app/(app)/*` — auth-gated UI
- `src/app/(auth)/login` — magic-link sign-in
- `src/app/api/invoices/[id]/pdf` — PDF stream
- `src/app/api/cron/recurring` — cron worker
- `src/lib/actions/*` — server actions (mutations)
- `src/lib/money.ts` — integer-cents + basis-points math
- `src/lib/invoice-number.ts` — transactional per-user invoice numbering
- `src/lib/pdf/*` — react-pdf template and renderer
- `src/proxy.ts` — Next 16 edge auth gate (renamed from middleware)
- `prisma/schema.prisma` — data model
