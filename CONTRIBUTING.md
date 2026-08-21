# Contributing

Thank you for helping improve V12 Ops.

## Before opening a change

- Search existing issues and pull requests before starting overlapping work.
- Keep each change focused and avoid committing credentials, generated output, or local environment files.
- For security issues, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.
- Note that this repository does not yet include a license. Ask the maintainers if your planned contribution depends on licensing terms.

## Development workflow

1. Use a supported Node.js release: 20.19+, 22.12+, or 24+.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and configure PostgreSQL and Supabase.
4. Start PostgreSQL with `docker compose up -d` and apply migrations with `npm run db:migrate:deploy`.
5. Create a focused branch and make the smallest coherent change.

Before requesting review, run:

```bash
npm run typecheck
npm test
npm run build
```

Run `npm run test:e2e` for route, authentication, or browser-visible changes.

## Pull requests

Describe the problem, the approach, validation performed, configuration or migration changes, and any remaining limitations. Include screenshots for visible UI changes, but never include real customer records or credentials.
