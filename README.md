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
- S3-compatible object storage with local MinIO
- OpenAPI contract with generated React Query and Zod clients
- First-party authentication with Argon2id password hashes
- Database-backed sessions with hashed session tokens and HttpOnly cookies
- AES-256-GCM encryption for carrier banking fields
- Loopback-only development authentication bypass

## Prerequisites

- Node.js 22
- pnpm 10
- Docker Desktop with Docker Compose v2

## Local environment

Create the local environment file.

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Bash:

```bash
cp .env.example .env.local
```

The application automatically loads `.env` and then `.env.local` from the repository root. Environment variables supplied by the operating system remain authoritative.

Before storing carrier banking data, generate a dedicated encryption key and place it in `BANK_DATA_ENCRYPTION_KEY` inside `.env.local`:

```bash
openssl rand -base64 32
```

Never commit that key.

## Install dependencies

```bash
pnpm install --frozen-lockfile
```

## Start local infrastructure

The local Compose stack binds every published service to `127.0.0.1`:

- PostgreSQL: `127.0.0.1:55432`
- MinIO API: `127.0.0.1:9000`
- MinIO console: `127.0.0.1:9001`

Start PostgreSQL and MinIO, wait for health checks, and create the private buckets:

```bash
pnpm infra:up
```

Inspect services:

```bash
pnpm infra:ps
```

Follow logs:

```bash
pnpm infra:logs
```

Stop services without deleting development volumes:

```bash
pnpm infra:down
```

## Initialize the development database

Start infrastructure and apply the current Drizzle schema:

```bash
pnpm local:setup
```

The equivalent explicit commands are:

```bash
pnpm infra:up
pnpm db:push
```

## Create the owner account

Set these values in `.env.local`:

```env
OWNER_EMAIL=owner@example.com
OWNER_PASSWORD=replace-with-a-long-private-password
OWNER_FIRST_NAME=Owner
OWNER_LAST_NAME=Name
```

Then run:

```bash
pnpm auth:bootstrap-owner
```

Passwords must contain at least 12 characters. The bootstrap command stores only an Argon2id password hash and never prints the plain-text password.

## Start the application

Terminal 1 — API on `http://127.0.0.1:5000`:

```bash
pnpm dev:api
```

Terminal 2 — frontend on `http://127.0.0.1:3000`:

```bash
pnpm dev:web
```

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

The immutable `dev` workflow runs:

```text
Docker Compose configuration validation
pnpm install --frozen-lockfile
OpenAPI client generation and synchronization check
Replit integration absence check
pnpm typecheck
pnpm build
```

Run the main checks locally:

```bash
pnpm infra:validate
pnpm typecheck
pnpm build
```

## Important development rules

- Never commit `.env.local`, encryption keys, passwords, access keys, or database credentials.
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

The repository is independent of Replit and has a reproducible local infrastructure baseline. Remaining work includes the final visual system, module-by-module product refactor, automated API and browser tests, accessibility validation, security review, and staged release validation.
