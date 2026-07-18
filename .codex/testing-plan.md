# Testing Plan

## Goal

Build layered coverage across Wafflelog without making the Expo/React Native setup painful to work with. Work from fast, deterministic tests outward:

1. Unit tests for pure helpers and schemas
2. Real in-memory SQLite integration tests for local persistence and sync orchestration
3. Supabase service tests for the real remote schema, triggers, Storage, and RLS
4. Component tests for focused UI contracts
5. A small Maestro E2E smoke suite for critical journeys

## Current Baseline

Completed and verified:

- Vitest is configured with `@` path aliases and loads local environment values for test processes.
- Unit coverage: 70 tests across 6 files, covering helper functions and dialog schemas.
- SQLite integration coverage: 46 tests across 13 files, using a real `better-sqlite3` in-memory database through the Expo-like adapter in `test/integration/sqlite/test-db.ts`.
- Supabase service coverage: 14 tests across 13 files, running against a local Docker Supabase stack.
- `npm run test:unit`, `npm run test:integration`, `npm run test:service:fast`, `npm run ts`, and `npm run lint` pass.

## 1. Unit Tests

Unit tests remain fast and pure. They should not require Expo runtime, SQLite, Supabase, React Native rendering, or network access.

Use unit tests for:

- display, permission, and mapping helpers
- form-validation schemas
- sync decision logic extracted into pure functions

Continue adding unit tests as pure helpers are introduced or changed.

## 2. SQLite Integration Tests

SQLite integration tests exercise local model actions against a fresh, real in-memory SQLite database. The production SQLite client remains unchanged; test-only adapter code belongs under `test/integration/sqlite/`.

### Completed

- database initialization, schema shape, and idempotency
- local CRUD/list/lifecycle behavior for trips, checklist items, expenses, pins, notes, reference links, documents, and images
- local companion access and pending-trip behavior
- pending-batch selection and local sync state
- outbound sync orchestration using real SQLite with mocked Supabase actions
- companion-trip pull synchronization and remote-to-local profile hydration

### Next

- add coverage whenever a local model gains a new lifecycle operation or sync state
- extract complex sync decisions into pure helpers when they become hard to cover through model tests
- retain real SQLite for all local persistence behavior; do not refactor the production client merely for tests

## 3. Supabase Service Tests

Service tests run against the local Docker Supabase stack rebuilt from committed migrations. They prove the real remote schema, RLS policies, triggers, Storage policies, and Auth interactions. Never point them at shared production data.

### Local environment

- `supabase/.env` is ignored and holds the local URL, JWT secret, publishable key, and secret key.
- `supabase/config.toml` references these values with `env(...)`.
- `supabase:prepare` restarts the local stack and resets the database from migrations.
- Each service test creates unique users and records, so `test:service:fast` can reuse a running database without fixture collisions. The clean reset removes accumulated test data when needed.

### Completed

- trip read and owner-only mutation boundaries
- invitation creation, acceptance, rejection, withdrawal, and terminal-state behavior
- accepted-invitation triggers: active membership and recipient-specific notifications
- notification read-state ownership
- active companion read/create/update behavior for shared trip content
- disabled-companion revocation for trip and relational child content
- creator-only pin updates/deletes
- checklist completion collaboration
- expense creator/payer attribution and member-only visibility
- notes, links, document metadata, and image metadata access
- Storage reads and uploads for `images` and `travel-documents`, limited to owners and active companions using `trip/{tripId}/...` paths

### Next

Test `lib/supabase/actions.ts` against the same local stack. The current service tests use direct Supabase clients deliberately to validate database contracts; the next layer should validate application action mapping, returned shapes, and error handling without replacing the real backend.

When a schema or RLS change is made:

1. Create a migration with `npx supabase migration new <name>`.
2. Reset locally with `npm run supabase:prepare` or `npx supabase db reset --local`.
3. Run `npm run test:service:fast`.
4. Deploy reviewed migrations to the linked project with `npx supabase db push`.

## 4. React Component Tests

Component tests cover small UI contracts with the service layer mocked. They do not replace service or E2E coverage.

Good targets include:

- invite form validation and submission states
- notification read-state interactions
- creator/payer labels
- permission-dependent actions
- checklist completion handlers

Prefer leaf components over full Expo Router screens.

## 5. E2E UI Tests

Use Maestro for a small set of high-value, user-visible smoke flows once service behavior is covered.

First companion flow:

1. Owner creates a trip and invites a companion.
2. Companion accepts from the notification center.
3. Companion creates and completes a checklist item.
4. Owner sees the shared update and companion attribution after sync.

Start with local Maestro runs. Expo's EAS Maestro job is currently alpha, so cloud runs should initially be manual or label-triggered rather than required on every pull request.

## Scripts and Gates

```json
{
  "test": "vitest run",
  "test:unit": "vitest run unit.test",
  "test:integration": "vitest run integration.test",
  "supabase:prepare": "restart local Supabase and reset it from migrations",
  "test:service": "prepare local Supabase, then run service tests",
  "test:service:fast": "run service tests against an already-running local stack",
  "test:watch": "vitest"
}
```

- Run unit and SQLite integration tests before merging relevant work.
- Run `npm run test:service` after Supabase schema/RLS changes and before releases. Use `npm run test:service:fast` during iteration.
- Run Maestro smoke flows before releases and for critical navigation/auth changes.
- Always run `npm run ts` and `npm run lint` alongside the relevant test level.
