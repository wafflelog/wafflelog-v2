# Local SQLite database

`initializeDatabase()` in [`init.ts`](./init.ts) creates the offline-first local database. The schema mirrors the app's locally cached trip data, with sync metadata on records that are reconciled with Supabase.

## Tables

| Table | Primary key | Purpose |
| --- | --- | --- |
| `trip` | `id` | A trip owned locally by `user_id`, including its lifecycle and sync state. |
| `trip_membership` | `(trip_id, user_id)` | A user's local membership in a shared trip. |
| `user_profile` | `id` | Cached public profile used for creator and payer attribution. |
| `checklist_item` | `id` | A shared checklist item belonging to a trip. |
| `pin` | `id` | A dated trip pin, with optional name, times, and JSON metadata. |
| `pin_location` | `pin_id` | Place/location data associated with a pin. |
| `note` | `id` | A note on a trip or optionally a pin. |
| `reference_link` | `id` | A reference link on a trip or optionally a pin. |
| `document` | `id` | Document metadata and its remote Storage location. |
| `image` | `id` | Image metadata, local URI, and remote Storage location. |
| `expense` | `id` | A trip expense, optionally attached to a pin, with payer attribution. |
| `expense_participant` | `(expense_id, user_id)` | A participant's exact share of an expense. |

## Shared record fields

Most synced content tables contain the following fields:

| Field | Meaning |
| --- | --- |
| `id` | UUID matching the remote Supabase record. |
| `user_id` | Creator/owner of the record. |
| `created_at`, `updated_at` | ISO timestamps. |
| `sync_status` | Local sync lifecycle state, such as pending, syncing, synced, or failed. |
| `last_synced_at` | Timestamp of the last successful remote synchronization. |
| `sync_error` | Latest synchronization error, if any. |
| `deleted_at` | Soft-delete timestamp. Soft-deleted records remain locally until their remote lifecycle is resolved. |

`trip_membership`, `user_profile`, and `pin_location` are locally cached support tables and do not use the full sync-status set.

## Table reference

### `trip`

Core trip record.

- Identity and ownership: `id`, `user_id`
- Content: `title`, `start_date`, `end_date`
- Lifecycle and sync: `created_at`, `updated_at`, `sync_status`, `last_synced_at`, `sync_error`, `deleted_at`

### `trip_membership`

Cached membership for shared trips.

- Composite key: `trip_id`, `user_id`
- Membership details: `role`, `status`, `source`
- Timestamps: `created_at`, `updated_at`, `last_synced_at`

### `user_profile`

Cached user profile for display-only attribution.

- `id`, `username`, `updated_at`

### `checklist_item`

Checklist content for a trip.

- Ownership and relation: `id`, `trip_id`, `user_id`
- Content: `title`, `completed` (`0` or `1`)
- Shared record fields

### `pin`

Trip pin and its date/time metadata.

- Ownership and relation: `id`, `trip_id`, `user_id`
- Content: `name`, `start_date`, `end_date`, `time`, `end_time`, `category_id`
- Metadata: `metadata_json` (defaults to `{ "version": 1 }`)
- Shared record fields

### `pin_location`

Optional place information attached to a pin.

- Identity and relation: `pin_id`, `user_id`
- Provider/place fields: `place_id`, `display_name`, `formatted_address`, `image_url`, `local_image_uri`, `rating`, `review_count`
- Coordinates: `latitude`, `longitude`
- Timestamps: `created_at`, `updated_at`

### `note`

Text content for a trip or pin.

- Ownership and relation: `id`, `trip_id`, `pin_id` (nullable), `user_id`
- Content: `text`
- Shared record fields

### `reference_link`

External reference for a trip or pin.

- Ownership and relation: `id`, `trip_id`, `pin_id` (nullable), `user_id`
- Content: `title` (nullable), `url`, `caption` (nullable)
- Shared record fields

### `document`

Document metadata; file bytes live in Supabase Storage rather than SQLite.

- Ownership and relation: `id`, `trip_id`, `pin_id` (nullable), `user_id`
- File metadata: `file_name`, `mime_type`, `storage_bucket`, `storage_path`, `caption` (nullable)
- Shared record fields

### `image`

Image metadata; its local file path and remote Storage location are both retained.

- Ownership and relation: `id`, `trip_id`, `pin_id` (nullable), `user_id`
- Local and remote file fields: `local_uri`, `storage_bucket`, `storage_path`, `mime_type`
- Display metadata: `width`, `height`, `caption` (nullable)
- Shared record fields

### `expense`

Expense associated with a trip or pin.

- Ownership and relation: `id`, `trip_id`, `pin_id` (nullable), `user_id`
- Content: `description`, `amount`, `currency`
- Payer attribution: `paid_by_user_id`, `paid_by_name`
- Shared record fields

### `expense_participant`

Participant allocation for a shared expense.

- Composite key: `expense_id`, `user_id`
- Allocation: `split_amount` stored as a two-decimal string
- Timestamps: `created_at`, `updated_at`
- Historical rows remain after a companion is disabled; they are ignored when the parent expense is soft-deleted.

## Relationships

```text
trip
├── trip_membership
├── checklist_item
├── pin
│   └── pin_location
├── note
├── reference_link
├── document
├── image
└── expense
    └── expense_participant

user_profile supplies display attribution for user_id / paid_by_user_id values.
```

SQLite does not declare foreign-key constraints for these relationships; model actions in [`model/`](./model/) maintain them.
