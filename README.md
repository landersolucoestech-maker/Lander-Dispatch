# Lander Dispatch

Lander Dispatch is an operational platform for transportation dispatch, loads, carriers, brokers, CRM, invoices, transactions, profit and loss, reports, documents, settings, and audit workflows.

## Repository status

This repository contains the active development baseline of the platform. It is not yet a production release.

- Supabase is intentionally deferred.
- Development occurs exclusively on `dev`.
- Validation and release promotion follow `dev` → `staging` → `main`.
- `main` is the production branch.
- Direct fixes in `staging` or `main` are prohibited.
- Test data must never be inserted outside development.

## Branch model

| Branch | Purpose |
| --- | --- |
| `dev` | Active development and integration |
| `staging` | Controlled validation candidate |
| `main` | Production-ready source only |

There is no separate `prod` branch.

## Current architecture

- pnpm monorepo
- React and Vite web application
- Express API
- PostgreSQL with Drizzle ORM
- OpenAPI contract with generated React Query and Zod clients
- First-party authentication with Argon2id password hashes
- Database-backed sessions with hashed session tokens and HttpOnly cookies
- Loopback-only development authentication bypass

## Local environment

Create the local environment file:

```bash
cp .env.example .env.local
```

The supplied database URL targets local PostgreSQL on port `55432`. Supabase must not be added until explicitly requested.

Install dependencies:

```bash
pnpm install --frozen-lockfile
```

Apply the development database schema:

```bash
pnpm db:push
```

Create or update the only owner account by setting `OWNER_EMAIL`, `OWNER_PASSWORD`, `OWNER_FIRST_NAME`, and `OWNER_LAST_NAME` in `.env.local`, then running:

```bash
pnpm auth:bootstrap-owner
```

Passwords must contain at least 12 characters. The command never prints or stores the plain-text password.

## Authentication modes

Authentication is enabled by default with `AUTH_DISABLED=false`.

The local bypass may be enabled only for explicit loopback development:

```env
NODE_ENV=development
HOST=127.0.0.1
AUTH_DISABLED=true
```

The API rejects bypass use on non-loopback binds and rejects forwarded or remote requests while bypass is active. Any remotely accessible environment must use real credentials, HTTPS, secure cookies, and `AUTH_DISABLED=false`.

## Validation

The `dev` workflow is immutable and runs:

```text
pnpm install --frozen-lockfile
OpenAPI client generation and synchronization check
Replit integration absence check
pnpm typecheck
pnpm build
```

## Important development rules

- Never commit `.env.local` or credentials.
- Never edit generated API clients manually.
- Change OpenAPI first, then regenerate clients.
- Never run destructive database operations without an isolated development database.
- Never promote branches automatically.
- Desktop, tablet, and mobile responsiveness are mandatory.
- The Dashboard headline is `DASHBOARD`, never `COMMAND CENTER`.

## Brand direction

Official brand assets belong under:

```text
apps/web/public/brand/
docs/brand/
```

The interface direction uses Poppins for headings, Inter for body text, a navy and blue operational palette, and responsive layouts for desktop, tablet, and mobile.

## Remaining development work

The repository is now independent of Replit. Remaining work includes the full product refactor, final visual system, complete module validation, local container orchestration, S3-compatible storage hardening, automated tests, security review, and staged release validation.
