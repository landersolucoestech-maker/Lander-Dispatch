# Lander Dispatch

Lander Dispatch is an operational platform for transportation dispatch, loads, carriers, brokers, CRM, invoices, transactions, profit and loss, reports, documents, settings, and audit workflows.

## Repository status

This repository was initialized from the latest project archive supplied for development. It is a **development baseline**, not a production release.

- Supabase is intentionally deferred.
- Development uses the `dev` branch.
- Validation and release promotion follow `dev` → `staging` → `prod`.
- No direct changes are permitted in `staging` or `prod`.
- Test data must never be inserted outside development.

## Branch model

| Branch | Purpose |
| --- | --- |
| `dev` | Active development and integration |
| `staging` | Controlled validation candidate |
| `prod` | Production-ready source only |

The three branches start from the same import commit. Future development must begin on `dev`.

## Current architecture

- Monorepo managed with pnpm
- React and Vite web application
- Express API
- PostgreSQL with Drizzle ORM
- OpenAPI contract with generated React and Zod clients

## Local environment

Copy the example environment file:

```bash
cp .env.example .env.local
```

The supplied default database URL targets a local PostgreSQL instance on port `55432`. Supabase must not be added until explicitly requested.

## Important development rules

- Do not commit `.env.local` or any credential.
- Do not edit generated API clients manually.
- Change OpenAPI first, then regenerate clients.
- Do not run destructive database operations without an isolated development database.
- Do not promote branches automatically.
- Desktop, tablet, and mobile responsiveness are mandatory.
- The Dashboard headline is `DASHBOARD`, never `COMMAND CENTER`.

## Brand direction

Official brand assets are stored under:

```text
apps/web/public/brand/
docs/brand/
```

The approved interface direction uses Poppins for headings, Inter for body text, a navy/blue operational palette, and responsive layouts for desktop, tablet, and mobile.

## Known migration work

The imported archive contains legacy platform-specific integrations. Their complete replacement with local first-party authentication, S3-compatible object storage, Dockerized PostgreSQL, and production-safe infrastructure remains development work for the `dev` branch. No claim is made that this import is production-ready.
