# Protected Development Seed

The development seed creates a realistic, connected dataset for Lander Dispatch without deleting user-created records.

## Safety model

The seed refuses to run unless every condition below is satisfied:

1. `NODE_ENV=development`.
2. `APP_ENV=development`.
3. The current Git branch is exactly `dev`.
4. `SEED_DEV_CONFIRM=LANDER_DISPATCH_DEV_ONLY` is supplied explicitly for the command.
5. The database target contains no production, staging, main, or master marker.
6. A local database must use `localhost` or `127.0.0.1` and must be named `lander_dispatch`.
7. A remote development database must exactly match `SEED_DEV_ALLOWED_DATABASE` in `host:port/database` format.

The command performs idempotent upserts using deterministic development IDs. It does not truncate tables and does not delete records created outside the seed dataset.

## Local setup

Start the infrastructure and apply the schema:

```bash
pnpm local:setup
```

### PowerShell

```powershell
$env:NODE_ENV="development"
$env:APP_ENV="development"
$env:SEED_DEV_CONFIRM="LANDER_DISPATCH_DEV_ONLY"
pnpm seed:dev
pnpm seed:dev:verify
Remove-Item Env:SEED_DEV_CONFIRM
```

The combined setup command is also available:

```powershell
$env:SEED_DEV_CONFIRM="LANDER_DISPATCH_DEV_ONLY"
pnpm local:setup:demo
Remove-Item Env:SEED_DEV_CONFIRM
```

### Bash, zsh, or sh

```bash
NODE_ENV=development \
APP_ENV=development \
SEED_DEV_CONFIRM=LANDER_DISPATCH_DEV_ONLY \
pnpm seed:dev

NODE_ENV=development \
APP_ENV=development \
SEED_DEV_CONFIRM=LANDER_DISPATCH_DEV_ONLY \
pnpm seed:dev:verify
```

## Remote development database

Do not use the seed against an unmarked remote database. Configure the exact target without credentials:

```text
SEED_DEV_ALLOWED_DATABASE=db.dev.example.test:5432/lander_dispatch_dev
```

Then run the same seed and verification commands with the explicit confirmation variable.

The allowlist value must exactly match the hostname, resolved port, and database name from `DATABASE_URL`.

## Seeded scenarios

The dataset includes:

- company profile;
- three Carriers with contacts, emergency contacts, operating targets, fleet equipment, drivers, CDL, and TWIC scenarios;
- three Brokers with coverage, payment terms, QuickPay, factoring, and onboarding states;
- three non-carrier CRM Contacts;
- four demand Leads using Dealer, Auction, Fleet/Rental Company, and Manufacturer types;
- no Carrier Lead;
- three driver qualification records, including one compliance-review scenario;
- eight Loads covering New, Dispatched, Picked Up, In Route, Delivered, and Canceled states;
- vehicle records linked to Loads;
- three commission Invoices linked to Carrier Loads;
- full and partial payment scenarios;
- income and expense Transactions;
- one audit event identifying the seed refresh.

## Verification

Run:

```bash
pnpm seed:dev:verify
```

The verifier confirms record counts, foreign-key relationships, financial links, load-status coverage, driver-compliance coverage, and the rule that Carrier cannot be a Lead.

The safety rules themselves are tested independently with:

```bash
pnpm seed:dev:guard
```
