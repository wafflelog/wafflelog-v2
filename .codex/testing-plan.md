# Testing Plan

## Goal

Add a small but useful test suite that protects the companion-trip business rules without making the Expo/React Native setup painful to work with.

The test strategy has three levels:

1. Unit tests
2. Integration tests
3. Service / end-to-end tests

## 1. Unit Tests

Unit tests should be fast, pure, and easy to run. They should not require Expo runtime, SQLite, Supabase, React Native rendering, or network access.

Use unit tests for:

- display helpers
- permission helpers
- mapping helpers
- form validation schemas
- sync decision logic

Good first targets:

- `lib/creator.ts`
  - current user renders `You`
  - known other user renders `@username`
  - missing profile renders `Unknown creator`
- `getLocalExpensePayerDisplayName`
  - payer is current user renders `You`
  - payer is another user with profile renders `@username`
  - old synced `paid_by_name = "You"` from another user renders `Unknown payer`
- permission helpers, once extracted
  - can edit own pin
  - cannot edit another user's pin
  - can delete own entity
  - cannot delete another user's pin/image/document/reference link/expense
  - active trip member can toggle checklist item
- form schemas
  - checklist item title is required
  - expense amount/currency/description validation

Suggested tooling:

```sh
npm install -D vitest
```

Suggested files:

```txt
lib/creator.unit.test.ts
lib/permissions.unit.test.ts
lib/sqlite/model/expense.unit.test.ts
components/dialog/new-checklist-item/schema.unit.test.ts
components/dialog/new-expense/schema.unit.test.ts
```

## 2. Integration Tests

Integration tests should exercise app code at an adapter boundary. They should verify how local model actions, sync orchestration, and Supabase actions behave when connected to a fake or controlled boundary.

Boundaries in this app:

- SQLite model layer
- Supabase action layer
- sync orchestration
- React Query cache behavior
- notification accept/decline actions

Good integration tests:

- `actionCreateLocalChecklistItem` inserts a pending local row.
- `actionListLocalTrips` returns owned trips plus active companion memberships.
- companion pull bundle upserts trip, child rows, and `user_profile`.
- owner pull bundle receives companion-created rows and profile data.
- expense list joins creator profile and payer profile correctly.
- pending checklist sync uses update for existing synced rows, not creator-changing upsert.
- invite accept creates `trip_member`.
- disabled companion membership removes local trip access after sync.

Suggested approach:

- Use `vitest`.
- Mock the Supabase client for most tests.
- Start with a mocked SQLite adapter rather than a real Expo SQLite database.
- Add a real test database adapter later only if the mocked tests become too limited.

Suggested files:

```txt
lib/sqlite/model/__tests__/checklist-item.integration.test.ts
lib/sqlite/model/__tests__/expense.integration.test.ts
lib/sqlite/model/__tests__/companion-trip-sync.integration.test.ts
lib/supabase/__tests__/actions.integration.test.ts
components/dialog/__tests__/new-checklist-item.integration.test.tsx
```

## 3. Service / End-To-End Tests

Use this level to prove the real companion-trip feature works across real boundaries.

In this project, distinguish between:

- Service tests: hit Supabase/local sync directly, but do not drive the UI.
- End-to-end tests: drive the app UI like a user.

### Service Tests

Service tests should run against local Supabase or a dedicated test Supabase project.

Good service tests:

- owner creates trip, invites companion, companion accepts, `trip_member` exists.
- companion creates checklist item, owner pull sync sees it.
- companion creates pin/image/document/reference link/expense, owner pull sync sees it.
- owner creates content, companion pull sync sees it.
- companion cannot update/delete another user's pin.
- companion cannot update/delete another companion's pin.
- active companion can toggle checklist item.
- disabled companion loses access.
- creator and payer usernames hydrate correctly from `public.user`.

### End-To-End UI Tests

Use E2E tests for full user flows, not tiny component states.

Recommended tooling for Expo/React Native:

- Maestro for user-flow E2E tests.

High-value E2E flows:

- owner creates a trip
- owner invites companion
- companion accepts invite from notification center
- companion creates checklist item
- owner syncs and sees checklist item with companion username
- owner creates checklist item
- companion toggles checklist item
- owner syncs and sees toggled state
- companion opens owner-created pin and does not see:
  - `Edit Pin`
  - `Delete Pin`
  - `Change Place`
- owner sees companion expense as `Paid by @companion`
- companion sees owner expense as `Paid by @owner`

## React Component Tests

React component tests sit between unit tests and E2E tests. They are useful for small UI contracts but should not replace full feature E2E tests.

Recommended tooling:

```sh
npm install -D jest-expo jest @testing-library/react-native @testing-library/jest-native
```

Good component tests:

- `CardPinLocationRegular`
  - shows `Change Place` when `onPress` is provided
  - hides `Change Place` when `onPress` is not provided
- `CardExpenseRegular`
  - shows `Paid by You`
  - shows `Paid by @username`
- `CardTripChecklistItem`
  - shows creator label
  - calls toggle handler on card press
  - calls delete handler on delete press

Avoid starting with full screen component tests. Screens using Expo Router, auth hooks, React Query, SQLite, Supabase, and native maps require a lot of mocking. Start with small leaf components first.

## Suggested Scripts

When `vitest` is added:

```json
{
  "test": "vitest run",
  "test:unit": "vitest run \"**/*.unit.test.ts\" \"**/*.unit.test.tsx\"",
  "test:integration": "vitest run \"**/*.integration.test.ts\" \"**/*.integration.test.tsx\"",
  "test:service": "vitest run \"**/*.service.test.ts\" \"**/*.service.test.tsx\"",
  "test:watch": "vitest"
}
```

When React Native component tests are added with Jest:

```json
{
  "test:components": "jest"
}
```

## First Milestone

Start with a focused unit-test milestone:

- add `vitest`
- add `lib/permissions.ts`
- test creator display logic
- test expense payer display logic
- test pin ownership permissions
- test own-entity update/delete permissions
- test checklist shared-toggle permission

This gives the companion-trip feature a meaningful safety net before adding slower adapter and UI tests.

## Suggested Gate Policy

- Run unit tests on every commit.
- Run integration tests before merging.
- Run service/E2E tests before release and after Supabase RLS changes.
- Always run `npm run ts` and `npm run lint` alongside the relevant test level.

