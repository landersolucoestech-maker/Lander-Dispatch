# Frontend mockup data

This directory contains visualization-only datasets for frontend modules that are not yet backed by persisted API entities.

## Rules

- Mock records live only in this directory.
- UI pages must not embed mock records directly.
- Mockup loading is controlled by `VITE_MOCKUP_DATA=true`.
- The bootstrap only seeds a store when its current persisted value is missing or effectively empty.
- Existing user-created local data is preserved.
- Backend-owned domains (loads, carriers, brokers, CRM, accounting, documents and company profile) continue to use the protected development database seed documented in `docs/development-seed.md`.

## Seeded frontend domains

- Agenda
- Operational Tasks
- Marketing (briefings, campaigns, calendar content, marketing tasks and AI history)
- Internal Chat
- Support Center
- Local Settings state (automations, integrations, public registration, workspace users and roles)

Dates are materialized relative to the current day so calendar and deadline views remain useful over time.
