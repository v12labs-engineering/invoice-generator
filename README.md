# V12 Ops

V12 Ops is a self-hostable operations workspace for small teams. It combines invoicing with customer, project, expense, sales, and people records in one business-scoped application.

> **Project status:** This repository is under active development. Review the security and licensing notes before deploying or redistributing it.

## What it includes

- Business workspaces with owner/member roles and email invitations
- Clients, contacts, products, projects, time entries, deals, and quotes
- Draft, finalized, sent, partially paid, paid, and void invoices
- Integer-cent money calculations, discounts, tax rates, multiple currencies, and three PDF templates
- PDF rendering, optional Vercel Blob storage, and optional invoice email delivery through Resend
- Recurring invoice schedules and subscription-to-expense processing through an authenticated cron route
- Expenses, CSV imports, attachments, and subscription records
- Employees, time-off requests, document templates, generated documents, and uploads
- Supabase email magic-link authentication and per-business data isolation in application queries

## Stack and architecture

- **Web:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- **UI:** Base UI, Radix UI, shadcn components, Recharts
- **Data:** PostgreSQL, Prisma 7, `@prisma/adapter-pg`
- **Authentication and file storage:** Supabase
- **Documents:** React PDF, Vercel Blob, Resend
- **Tests:** Vitest and Playwright

Important paths:

```text
src/app/(app)/             Authenticated product routes
src/app/(auth)/login/      Supabase magic-link sign-in
src/app/api/               PDF and recurring-job endpoints
src/lib/actions/           Server actions and business scoping
src/lib/pdf/               Invoice PDF data and templates
src/lib/supabase/          Browser, server, and proxy clients
prisma/schema.prisma       PostgreSQL data model
prisma/migrations/         Versioned database migrations
tests/unit/                Calculation and scheduling tests
tests/e2e/                 Browser smoke tests
```

## Prerequisites

- Node.js 20.19+, 22.12+, or 24+
- npm 10+
- Docker with Compose, or another PostgreSQL server
- A Supabase project with email authentication enabled

Optional integrations are needed only for their related features:

- Supabase Storage buckets for document, expense attachment, and logo uploads
- Resend and Vercel Blob for emailing invoices with stored PDFs
- Vercel Cron or another scheduler for recurring records

## Environment variables

Copy the committed template and replace every placeholder you use:

```bash
cp .env.example .env
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Runtime PostgreSQL connection used by Prisma. |
| `DIRECT_URL` | Yes | Direct PostgreSQL connection used by Prisma migrations and seed. It can match `DATABASE_URL` locally. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. Public by design. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase browser-safe publishable key. |
| `SUPABASE_SECRET_KEY` | For uploads | Server-only key used for Supabase Storage operations. |
| `NEXT_PUBLIC_APP_URL` | Recommended | Public application origin used in invitation links. |
| `RESEND_API_KEY` | For email | Server-only Resend API key. The legacy `AUTH_RESEND_KEY` name is also accepted. |
| `RESEND_FROM` | For email | Verified sender identity used for invitations and invoices. |
| `BLOB_READ_WRITE_TOKEN` | For stored/sent PDFs | Server-only Vercel Blob token. Local PDF preview does not require it. |
| `CRON_SECRET` | For recurring jobs | Bearer token protecting `/api/cron/recurring`. |
| `SEED_EMAIL` | For seeding | Email for the local demo owner created by `npm run db:seed`. |
| `SEED_NAME` | No | Display name for the seeded owner. |
| `SEED_BUSINESS_NAME` | No | Name of the seeded demo business. |

Supabase Storage integrations expect buckets named `documents`, `expenses`, and `logos`. Configure access policies appropriate to your deployment before enabling uploads.

## Local setup

1. Install dependencies.

   ```bash
   npm install
   ```

2. Start the included PostgreSQL service.

   ```bash
   docker compose up -d
   ```

3. Create and fill `.env`.

   ```bash
   cp .env.example .env
   ```

4. In Supabase, enable email magic-link authentication and add `http://localhost:3000/auth/callback` to the allowed redirect URLs.

5. Apply migrations and generate the Prisma client.

   ```bash
   npm run db:migrate:deploy
   npm run db:seed        # optional demo records; requires SEED_EMAIL
   ```

6. Start the application.

   ```bash
   npm run dev
   ```

Open [http://localhost:3000/login](http://localhost:3000/login). Sign in with a Supabase magic link. A new user without an invitation can create a business during onboarding.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with Turbopack. |
| `npm run build` | Generate Prisma Client and create a production build. |
| `npm start` | Serve a completed production build. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm test` | Run the Vitest unit suite. Database-backed tests need PostgreSQL. |
| `npm run test:e2e` | Run Playwright smoke tests against the development server. |
| `npm run db:migrate` | Create/apply a migration during development. |
| `npm run db:migrate:deploy` | Apply committed migrations. |
| `npm run db:push` | Push the schema without creating a migration. |
| `npm run db:seed` | Create local demo owner/business/client/product data. |
| `npm run db:studio` | Open Prisma Studio. |

## Production notes

- Provision PostgreSQL and set both database URLs. Use a direct connection for migrations; choose a pooler-compatible runtime URL where required by your provider.
- Configure the Supabase auth redirect URL for the production origin and create the documented Storage buckets only if upload features are enabled.
- Keep `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`, and `CRON_SECRET` server-side. Never prefix secrets with `NEXT_PUBLIC_`.
- Apply migrations as a deliberate release step with `npm run db:migrate:deploy`.
- `vercel.json` schedules `/api/cron/recurring` daily at 02:00 UTC. Other platforms must call the route with `Authorization: Bearer <CRON_SECRET>`.
- Generated invoice PDFs uploaded through Vercel Blob and files returned by `getPublicUrl` are publicly addressable. Do not use the current storage design for confidential files without changing access controls.

## Security

Do not commit `.env` files or real credentials. The repository ignores environment files except `.env.example`. Run `npm audit` after dependency changes and follow [SECURITY.md](SECURITY.md) when reporting vulnerabilities.

## Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md) for the local quality checks and pull-request workflow.

This repository does not currently include a license. Copyright law therefore reserves reuse and redistribution rights by default. The repository owner should choose and add an open-source license before presenting the project as open source.
