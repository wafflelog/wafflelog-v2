# Shared expense ledger

## Problem

The current expense record answers only **who paid**:

- `expense.paid_by_user_id`
- `expense.paid_by_name`

It does not record who benefited from the expense. Consequently, the trip expense screen can show total spend and what the current user paid, but cannot calculate what each person owes, is owed, or should transfer to another person. `youAreOwed` is currently a placeholder value of `0`.

The enhancement turns expenses into a shared-trip ledger. Every expense has one payer and one or more participants who share its cost. A participant can be excluded—for example, Alice can pay for a dinner without owing a share because she did not eat.

## Product decisions

### First release

- Each expense is in one currency and is split **equally** among selected participants.
- The payer may, but does not have to, be a participant.
- Any trip owner or active companion can create an expense and select the current trip participants.
- Only the owner and active companions are selectable for a new expense. Participant rows remain as historical ledger data if a companion is later disabled or otherwise becomes inactive.
- A ledger is calculated independently per currency. The app must never combine EUR, GBP, USD, and so on without an explicit exchange-rate feature.
- All displayed expense, balance, and settlement amounts are rounded and formatted to two decimal places.
- Existing expense data is disposable because the app is not live; remove it during the migration rather than inventing historical participant allocations.
- Keep the present no-edit product policy for expense content. A mistaken expense is deleted and recreated, which keeps the sync and ledger model simple.

### Not in the first release

- Adjustable/custom participant amounts.
- Exchange rates or cross-currency settlement.
- Marking suggested transfers as paid.
- Expenses paid by somebody outside the trip.

The schema will keep a decimal `split_amount` field. The first release generates equal values for every selected participant; a later UI can make those values editable while requiring their total to match the expense amount.

## Data model

### New relationship: `expense_participant`

An expense needs a child row for every user who bears a share of it.

| Column | Type | Notes |
| --- | --- | --- |
| `expense_id` | UUID / text | Parent expense. |
| `user_id` | UUID / text | Trip participant who owes a share. |
| `split_amount` | decimal | Amount this participant owes for the expense. First release derives an equal amount. |
| `created_at` | timestamp / text | Audit and sync ordering. |
| `updated_at` | timestamp / text | Audit and sync ordering. |

Primary key: `(expense_id, user_id)`.

This is a relationship, not a JSON array on `expense`: it can be indexed, queried, protected by RLS, synced independently, and joined for ledger queries. It also provides the natural future extension point for custom per-person amounts rather than abstract split weights.

### Remote Supabase

Create a migration adding `public.expense_participant`:

- foreign key to `expense(id)` with `on delete cascade`
- foreign key to `public.user(id)`
- `split_amount numeric(14,2) not null`
- `check (split_amount >= 0)`
- Row Level Security enabled
- read policy: expense creator, trip owner, or active trip companion
- insert/delete policy: the same people who may create/delete the parent expense, with a policy/trigger validation that the selected `user_id` is the trip owner or an active `trip_member`

The parent expense and its participant rows must be written as one logical remote operation. Prefer an authenticated, security-invoker Postgres RPC such as `upsert_expense_with_participants`, rather than a client-side sequence that could leave a remote expense temporarily without participants. The RPC should:

1. authenticate the caller through normal RLS,
2. upsert the parent expense,
3. validate every selected user belongs to the trip at write time,
4. generate and validate participant `split_amount` values, replace its participant set atomically, and
5. return the expense and participants.

Do not use user metadata for authorization. The migration must grant only the required authenticated access, use RLS, and avoid a `SECURITY DEFINER` shortcut.

Migrate remote `expense.amount` from `double precision` to `numeric(14,2)`. Store local expense and participant monetary values as decimal `TEXT` values in SQLite, not floating-point `REAL`, to preserve exact two-decimal amounts. The UI formats every amount to two decimal places.

### Local SQLite

Add an `expense_participant` table in `lib/sqlite/init.ts`:

```sql
create table if not exists expense_participant (
  expense_id text not null,
  user_id text not null,
  split_amount text not null,
  created_at text not null,
  updated_at text not null,
  primary key (expense_id, user_id),
  check (cast(split_amount as real) >= 0)
);
create index if not exists expense_participant_user_id_idx
  on expense_participant (user_id);
```

Extend the local expense model so `LocalExpense` includes `participants`, each with `userId`, cached `username`, and `splitAmount`. Add a local participant/list action that returns the trip owner plus active membership rows with profiles; this powers the form. Historical participant profiles—including disabled or former members—remain available to render past ledger balances.

Creating an expense and its participant rows must occur in one `withTransactionAsync` transaction. Soft or hard deletion of an expense should remove/ignore participant rows consistently. Pull-sync must replace the local participant set for an incoming remote expense in the same transaction as the parent upsert.

## Sync design

The offline-first source of truth remains SQLite.

1. User creates an expense locally with payer and selected participants.
2. SQLite writes the parent `expense` and its `expense_participant` rows atomically, marking the parent pending.
3. Existing pending-expense selection picks up the parent.
4. The remote action submits the expense plus participant IDs and decimal split amounts as one RPC payload.
5. On success, the parent becomes synced and participant rows are considered synced with it.
6. The remote trip sync bundle includes participant rows for every returned expense.
7. Local pull-sync upserts the parent, replaces its participants, and refreshes user profiles needed to render payer/participant names.

`expense_participant` does not need a separate pending queue in the first release because it is owned and synchronized by its parent expense. If independent editing is later introduced, promote it to its own sync lifecycle.

## Calculation model

All calculations are made per `(trip_id, currency)`.

For an expense with amount `A`, payer `P`, and participant allocations `splitAmount[U]`:

- Payer paid: `paid[P] += A`
- Each participant `U` owes: `owed[U] += splitAmount[U]`
- Net balance: `net[U] = paid[U] - owed[U]`

Positive net means the user is owed money. Negative net means the user should pay money. The totals must sum to zero exactly per currency.

### Equal split and rounding

Never calculate balances using JavaScript floating-point arithmetic. Convert a validated input amount to integer minor units first.

For the first-release equal split:

1. `base = floor(amountMinor / participantCount)`
2. Give every participant `base`.
3. Allocate the remaining minor units in a deterministic order (for example ascending user ID).

Persist the resulting two-decimal `split_amount` values, rather than recalculating them on every device. This preserves deterministic historical balances. A later custom-split form may edit individual allocations, but must validate that the two-decimal participant total exactly equals the two-decimal expense total.

### Suggested settlements

For each currency, derive—not persist—minimal transfers from net balances:

1. Build creditors (`net > 0`) and debtors (`net < 0`).
2. Sort both lists deterministically by amount, then user ID.
3. Transfer `min(creditor.net, abs(debtor.net))` from the current debtor to the current creditor.
4. Continue until all balances reach zero.

Example: dinner costs EUR 90; Bob pays; Bob and Cara are selected. Bob paid EUR 90 and owes EUR 45, Cara owes EUR 45. The result is one suggested transfer: Cara pays Bob EUR 45. Alice is excluded and has no balance change.

The calculation module should be a pure helper, e.g. `lib/helper/shared-expense.ts`. It should accept normalized ledger inputs and return participant balances plus suggested settlements; no SQLite, Supabase, React, or date dependencies.

## UI scope

### New expense dialog

Extend `DialogNewExpense` with:

- **Paid by** selector, defaulting to the current user.
- **Split with** multi-select list, defaulting to every active trip participant including the payer. Disabled/former members cannot be selected for a new expense.
- participant names from cached `user_profile` and local membership data.
- validation requiring at least one selected participant.
- a compact preview: “EUR 90.00 split between Bob and Cara: EUR 45.00 each.”

When opened from a pin, preserve the existing pin association. The participant controls are identical for pin-level and trip-level expenses.

### Expense cards

Keep the existing description, context, amount, payer, and creator. Add a concise split line such as:

`Split with Bob, Cara` or `Split with 4 people`.

### Trip ledger screen

Replace the placeholder summary with a currency-specific ledger:

- total spending
- **You paid**
- **Your share**
- **Net**: “You are owed EUR 45.00” or “You owe EUR 45.00”
- per-person balances, using “You” where appropriate
- suggested transfers, e.g. “Cara pays Bob EUR 45.00”
- current per-currency tabs remain; the list and balances use the selected currency

The ledger is read-only derived state. Do not save balances or settlement recommendations; regenerate them whenever expenses or memberships are refreshed.

## Testing plan

### Unit tests — required before UI work

Add exhaustive tests for the pure shared-expense calculation helper:

- one payer, one participant
- payer included in an equal split
- payer excluded from an equal split
- a participant excluded from an expense
- multiple expenses with different payers
- amounts that do not divide evenly, including deterministic remainder allocation
- decimal split amounts sum exactly to the total and retain two decimal places
- zero amount / no participants / negative split amounts / split totals not matching the expense rejected by input validation
- multiple currencies kept completely separate
- balance conservation: all net balances sum to zero in minor units
- settlement conservation: suggested transfers fully clear every net balance
- deterministic settlement output for the same inputs regardless of input order

### SQLite integration tests

- initialization and migration create `expense_participant`
- creating an expense writes its selected participants atomically
- listing expenses includes cached participant profiles
- soft delete excludes an expense and all of its participant rows from the ledger
- pending expense sync sends payer plus participant rows
- remote pull replaces a local participant set without duplicate/stale rows

### Supabase service tests

- owner and active companions can read an expense and its participant rows
- active companion can create an expense with valid trip participants
- unrelated user cannot read or write either table
- disabled companion cannot create or read new expense participant data
- selected users must be owner/active members of that trip when a new expense is created
- parent expense and participant mutation is atomic
- remote sync bundle includes only accessible expense participant rows

### Component tests

- default payer and default split selection
- selecting/deselecting participants and the minimum-one validation
- split preview and rounding display
- ledger labels for owes versus is owed
- currency tabs do not combine balances

## Migration and rollout

1. Add the remote migration, including removal of existing expense and participant data, regenerate `lib/supabase/types.ts`, reset local Supabase, and run service tests.
2. Add the local SQLite table and migration/initialization path, then add SQLite integration tests.
3. Add sync bundle/action payloads and verify offline create → remote sync → second device pull.
4. Add the pure calculation helper and unit tests.
5. Ship the dialog participant selection, then the ledger view.
6. Do not backfill legacy expense data; remove it as part of the migration because the app is not live.

## Confirmed decisions

- The first release supports equal splits only; custom decimal participant amounts are a later extension.
- Legacy expense data is removed during migration.
- Disabled/former companions remain visible in historical ledger balances, but cannot be selected for newly created expenses.
- Use `numeric(14,2)` remotely and decimal `TEXT` values locally; calculations must use decimal-safe arithmetic rather than JavaScript floating-point values.
