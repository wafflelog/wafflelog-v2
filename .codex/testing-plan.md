# Testing Plan

## Goal

Build useful, layered coverage across Wafflelog without making the Expo/React Native setup painful to work with. Work from fast, deterministic tests outward:

1. Unit tests for pure helpers and schemas
2. Real in-memory SQLite integration tests for local persistence
3. Supabase service tests for remote data, sync, and RLS
4. Component tests for focused UI contracts
5. A small Maestro E2E smoke suite for critical journeys

## Current Baseline

Completed and verified:

- Vitest is configured with `@` path aliases.
- Unit coverage: 70 tests across 6 files, covering helper functions and dialog schemas.
- SQLite integration coverage: 7 tests across 4 files, using a real `better-sqlite3` in-memory database through the Expo-like adapter in `test/integration/sqlite/test-db.ts`.
- `npm run test:unit`, `npm run test:integration`, `npm run ts`, and `npm run lint` pass.

Current SQLite integration files:

```txt
test/integration/sqlite/init.integration.test.ts
test/integration/sqlite/checklist-item.integration.test.ts
test/integration/sqlite/trip.integration.test.ts
test/integration/sqlite/expense.integration.test.ts
```

## 1. Unit Tests

Unit tests should remain fast and pure. They should not require Expo runtime, SQLite, Supabase, React Native rendering, or network access.

Use unit tests for:

- display, permission, and mapping helpers
- form-validation schemas
- sync decision logic extracted into pure functions

Continue adding unit tests as pure helpers are introduced or changed.

## 2. SQLite Integration Tests

SQLite integration tests exercise local model actions against a fresh, real in-memory SQLite database. The production SQLite client remains unchanged; test-only adapter code belongs under `test/integration/sqlite/`.

### Completed

- database initialization, schema shape, and idempotency
- checklist-item creation, list filtering/order, soft-delete exclusion, and creator profile attribution
- trip ownership and active-companion access, filtering, and ordering
- expense creator/payer profile joins, pin/location mapping, ordering, and soft-delete exclusion

### Next: Local Lifecycle Coverage

Add focused coverage for each model's local lifecycle before testing remote sync orchestration:

1. Checklist items: toggle completion; soft/hard deletion; pending-item batch selection and limit.
2. Trips: get-by-ID access rules; update/delete lifecycle; pending-trip batch selection.
3. Expenses: update/delete/sync-state transitions; pending batch selection and limit.
4. Pins, notes, reference links, documents, and images: repeat the same creation/listing/lifecycle pattern.

### Later: Sync Orchestration

Use the same real SQLite adapter while mocking only Supabase actions. Cover pull-bundle upserts, pending-row pushes, retry/error state, and creator/payer profile hydration.

## 3. Supabase Service Tests

Service tests prove the real remote data model, database policies, and sync boundaries. Run them against local Supabase or a dedicated isolated test project/branch, never shared production data.

Companion invitation coverage belongs primarily here:

- owner creates a trip and invites a companion
- only the invitee can read and accept the invitation
- acceptance creates an active `trip_member` record
- active companions can read the trip and permitted child content
- unrelated users and disabled companions cannot access that data
- ownership restrictions prevent companions from changing another creator's content

## 4. React Component Tests

Component tests cover small UI contracts with the service layer mocked. They do not replace service or E2E coverage.

Good targets include invite form validation/submission states, creator/payer labels, permission-dependent actions, and checklist event handlers. Prefer leaf components over full Expo Router screens.

## 5. E2E UI Tests

Use Maestro for a small set of high-value, user-visible smoke flows once service behavior is covered.

First companion flow:

1. Owner creates a trip and invites a companion.
2. Companion accepts from the notification center.
3. Companion creates a checklist item.
4. Owner sees it after sync with the companion's attribution.

Start with local Maestro runs. Expo's EAS Maestro job is currently alpha, so cloud runs should initially be manual or label-triggered rather than required on every pull request.

## Scripts and Gates

Current scripts:

```json
{
  "test": "vitest run",
  "test:unit": "vitest run unit.test",
  "test:integration": "vitest run integration.test",
  "test:watch": "vitest"
}
```

Add service, component, and E2E scripts only with their corresponding test layers.

- Run unit and SQLite integration tests before merging relevant work.
- Run service tests after Supabase schema/RLS changes and before releases.
- Run Maestro smoke flows before releases and for critical navigation/auth changes.
- Always run `npm run ts` and `npm run lint` alongside the relevant test level.
