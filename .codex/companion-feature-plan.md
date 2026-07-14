# Companion Feature Plan

## Goal

Build a Companion feature where a trip owner can invite other users to co-edit a trip with limited permissions.

The owner remains the only admin. Companions can contribute trip content, but they should not manage trip settings, delete the trip, or manage other companions.

## Current App Starting Point

The app already has partial scaffolding and some working companion MVP pieces:

- `app/(stack)/trip/[id]/(drawer)/companions.tsx`
- `app/(stack)/user-search.tsx`
- `components/card/companion/*`
- `trip_invitation` in Supabase types
- `trip_member` in Supabase types
- `app_notification` in Supabase types
- `app/(stack)/notification-center.tsx`
- `components/global/db-sync.tsx`

The remaining work is mainly around local-first shared-trip sync, membership-aware permissions for child records, companion-specific UI rules, and later invite links.

## Product Decisions

- Companions can edit and delete pins they created.
- Checklist items are not directly edited. Any trip member can add checklist items and toggle completed/not completed.
- Only the creator of a checklist item can remove it.
- Trip deletion is owner-only and soft-deletes the trip plus all child records, regardless of who created them.
- Invite links expire after 1 week.
- User search is username-only for privacy. Do not expose email search.
- Add a UI affordance for users to copy or share their own username.
- `trip_invitation` should not represent ongoing membership.
- `trip_member` is the source of truth for who is in a trip.
- Owner remains stored on `trip.user_id`; do not duplicate the owner into `trip_member` for now.
- `trip_member` is for companions only.
- `removed` / `left` were renamed conceptually to disabled access. Disabled membership keeps the door open for restoring accidental removals.
- Companion trips should be synced into the invitee's local SQLite DB, not fetched remotely every time. The home screen should ultimately list local trips only.
- Multi-user clash risk is acceptable because members mostly add/remove their own entities rather than co-editing one shared entity. Checklist toggles are the main shared mutation to handle carefully.

## Core Model

- `trip.user_id` is the owner.
- Owner is the only admin.
- `trip_invitation` represents invitation lifecycle only.
- `trip_member` represents active or disabled companion membership.
- A pending invitation does not grant trip access.
- Accepting an invitation creates or restores an active `trip_member` row.
- An active `trip_member` row grants limited companion access.
- A disabled `trip_member` row keeps history/restoration state but should not grant access.
- Companions can add their own records to a trip.
- Companions can update or soft-delete their own records only, unless we explicitly expand this later.
- Any trip member can toggle checklist completion, but only the checklist item creator can remove it.
- Owner-only trip deletion soft-deletes the trip and all child records.

## Remote Database Design

### Existing Table: `trip_invitation`

Use this as the invitation lifecycle table only.

Current fields:

- `id`
- `trip_id`
- `inviter_user_id`
- `invitee_user_id`
- `status`
- `responded_at`
- `created_at`
- `updated_at`

Current statuses:

- `pending`
- `accepted`
- `rejected`
- `withdrawn`

Notes:

- `accepted` is historical invitation state, not membership state.
- Pending invitations create an `app_notification` for the invitee.
- Accepted and rejected invitations create an owner notification.
- The previous attempt to use `trip_invitation` for membership caused RLS recursion and unclear naming.

Optional future fields:

- `invite_token`
- `expires_at`

### Current Table: `trip_member`

Use this as the companion membership/access table.

Current fields:

- `id`
- `trip_id`
- `user_id`
- `role`, currently `companion`
- `status`, currently `active` or `disabled`
- `disabled_reason`, currently `owner_disabled` or `user_left`
- `created_from_invitation_id`
- `created_at`
- `updated_at`

Notes:

- Unique membership is enforced by `trip_id + user_id`.
- `trip_member` currently excludes the owner.
- `active` grants shared trip access.
- `disabled` removes access while preserving the relationship for possible restoration.
- Accepting a pending invitation syncs `trip_member` through a DB trigger.

### Optional Future Table: `trip_invite_link`

Use this for share links and new-user invitations.

Fields:

- `id`
- `trip_id`
- `owner_user_id`
- `token_hash`
- `status`
- `max_uses`
- `used_count`
- `expires_at`
- `created_at`
- `updated_at`

Statuses:

- `active`
- `revoked`
- `expired`

## Local SQLite Design

Shared-trip behavior should be local-first. After a companion accepts an invitation, the remote trip and allowed child records should sync into that companion's local SQLite DB.

Suggested local membership table: `trip_membership`

Fields:

- `trip_id`
- `user_id`
- `role`
- `status`
- `source`, for example `owner` or `companion`
- `created_at`
- `updated_at`
- `last_synced_at`

This lets the app quickly determine whether the current user is an owner or companion without deriving it from remote invitations every time.

Remote records to pull for accepted companion trips:

- `trip`
- `trip_member`
- `pin`
- `checklist_item`
- `note`
- `reference_link`
- `expense`
- `document`
- `image`

Home screen direction:

- Remove the remote live-fetch dependency from `actionListAcceptedCompanionTrips`.
- Sync accepted companion trips into SQLite.
- Let `actionListLocalTrips` become the main source for owner and companion trips.

## Permissions And RLS

RLS is the most important part of this feature.

### Trip Access

Owner can:

- Read their trips
- Update trip settings
- Soft-delete trips
- Manage companions

Accepted companions can:

- Read shared trips
- Read allowed trip child records
- Insert allowed child records

Pending invitees can:

- Read enough invitation and trip preview data to accept or reject

### Companion Write Access

Accepted companions can insert:

- Pins
- Trip or pin expenses
- Trip or pin images
- Trip or pin documents
- Trip or pin links
- Trip or pin comments/notes

Companions should not:

- Update trip settings
- Delete the trip
- Manage invitations
- Remove other companions
- Update or delete records created by other users, unless we decide otherwise later

Special cases:

- Any trip member can toggle checklist item completion.
- Only the checklist item creator can remove a checklist item.
- Owner-only trip deletion soft-deletes all trip child records, including records created by companions.

### Tables Needing Membership-Aware RLS

- `trip`
- `trip_invitation`
- `app_notification`
- `pin`
- `note`
- `reference_link`
- `expense`
- `document`
- `image`
- `checklist_item`, if companions can use checklist
- Supabase storage policies for images and documents

## UI Work

### Owner Companion Management

- Show invited, accepted, withdrawn, and disabled states as appropriate.
- Invite an existing user by username.
- Withdraw pending invite.
- Disable accepted companion access.
- Restore disabled companion access.
- Copy or share invite link.
- Enforce max companion count.

### Invitee Flow

- Notification or deep link opens invitation detail.
- Invitee can accept or reject.
- Accepted trip syncs locally and appears in the app.
- Withdrawn, expired, or unavailable invitations show a clear error.

### Companion Trip UI

- Show shared trip on home.
- Allow access to trip detail.
- Hide owner-only settings and management actions.
- Show leave trip action.
- Allow add buttons only for permitted entities.
- Add a copy/share username action on the user's own profile or account screen.
- Show creator information where useful.

### Notification UI

Replace placeholder notification data with real `app_notification` records.

Notification types:

- Trip invitation received
- Invitation accepted
- Invitation rejected
- Invitation withdrawn
- Companion access disabled
- Companion access restored
- Companion left, if the product keeps a separate leave flow

## Persistence And Sync

Current sync is local-first and owner/user scoped. Companion trips are temporarily fetched remotely by `actionListAcceptedCompanionTrips`, but this is now considered inaccurate because most trip detail screens rely on local SQLite records and offline editing is a product goal.

Recommended approach:

1. Keep owner-created trips local-first.
2. Sync active companion trips from Supabase into the invitee's local SQLite DB.
3. Pull relevant child records into SQLite for offline viewing/editing.
4. Let companions create allowed records locally with `user_id = current user`.
5. Upload companion-created records through existing sync once RLS permits active companions.
6. Keep conflict handling simple by preferring append/remove ownership rules over co-editing the same row.

Do not build more screens around remote live-fetch companion trips. Treat the current `actionListAcceptedCompanionTrips` approach as a temporary bridge to replace.

## Phases

### Phase 0: Product Rules

Priority: completed.

Decisions:

- Companions can edit and delete their own pins.
- Any trip member can add checklist items and toggle checklist completion.
- Only checklist item creators can remove their checklist items.
- Owner-only trip deletion soft-deletes all child records.
- Invite links expire after 1 week.
- Search is username-only.
- Users should be able to copy or share their own username.

### Phase 1: Invitation MVP

Priority: mostly completed.

Tasks:

- Harden `trip_invitation` statuses. Completed.
- Split membership into `trip_member`. Completed.
- Prevent duplicate active memberships. Completed via `trip_member` uniqueness.
- Owner can invite existing users by username. Completed.
- Owner can withdraw pending invites. Completed.
- Invitee can accept or reject from notification center. Completed.
- Accepting invite creates `trip_member`. Completed.
- Companion list reflects real remote data. Completed for active, pending, and disabled rows.
- Replace optimistic-only remove behavior with real mutations. Completed for withdraw and disable.
- Accepted trips show via local sync. Not completed; this replaces the temporary remote-fetch approach.

### Phase 2: Permission Foundation

Priority: high.

Tasks:

- Add or verify RLS policies for owner versus accepted companion.
- Lock trip settings to owner.
- Allow companions to insert permitted child records.
- Restrict updates and deletes to owner or record creator, with checklist completion as the shared-toggle exception.
- Ensure owner-only trip deletion can soft-delete all child records.
- Add storage policies for companion uploads.
- Verify policies with real owner and companion accounts.

### Phase 3: Companion Trip Experience

Priority: high.

Tasks:

- Sync accepted companion trips into invitee local SQLite.
- Make trip detail pages work from local SQLite for accepted companion trips.
- Hide owner-only screens and actions.
- Show shared trip context.
- Cache public usernames locally and show creator attribution on pin, checklist item, image, document, reference link, and expense cards.
- Let companions add pins, notes, expenses, links, documents, and images.
- Ensure `user_id`, `paid_by_user_id`, and creator display are correct.

### Phase 4: Notifications

Priority: partially completed.

Tasks:

- Replace placeholder notifications with `app_notification` queries. Completed.
- Create notifications for invite, accept, and reject. Completed.
- Add mark-as-read behavior for invite accept/decline. Completed.
- Create notifications for withdraw, disabled access, restored access, and leave. Not completed.
- Navigate from notification to invitation or trip.

### Phase 5: Share Link And New User Invite

Priority: medium.

Tasks:

- Add invite link table or token support.
- Add deep link route for invite tokens.
- If logged out, send user to register or login, then resume invite.
- Let existing users join from a link.
- Handle withdrawn, expired, already-used, and invalid links.

### Phase 6: Leave And Remove Semantics

Priority: medium-high.

Tasks:

- Add companion leave flow.
- Ask companion whether to keep their records.
- If keeping records, mark membership disabled with a `user_left` reason and keep content.
- If removing records, soft-delete current user's trip child records.
- Add owner disable/restore companion access flow.
- Keep trip deletion owner-only and soft-delete all child records when a trip is deleted.
- Ensure pending sync handles these state changes cleanly.

### Phase 7: Connections

Priority: low.

Tasks:

- Add `user_connection` table.
- Allow users to add searched users as contacts.
- Show connections first in invite search.
- No acceptance required for connection.
- Use connections only as an invite convenience, not as authorization.

## Recommended Build Order

Completed or in progress:

1. Prototype companion UI with hardcoded data. Completed.
2. Invitation status mutations: accept, reject, withdraw. Completed.
3. Split `trip_invitation` and `trip_member`. Completed.
4. Notification-backed invitee accept/reject flow. Completed.
5. Companion list using real `trip_member` and pending `trip_invitation` data. Completed.

Next recommended order:

1. Replace `actionListAcceptedCompanionTrips` remote fetch with local-first companion trip sync.
2. Add local membership/access metadata so local screens can distinguish owner and companion trips.
3. Pull accepted companion trips and child records into SQLite.
4. Verify accepted companion can open the shared trip offline.
5. Add membership-aware RLS for child record insert/update/delete.
6. Allow companion content creation and sync upload.
7. Add creator attribution to shared content cards for ownership clarity and testing.
8. Add owner-only UI restrictions and companion-specific affordances.
9. Share invite links.
10. Leave/disable/restore cleanup.
11. Connections.

## Recommendation

Do not start with share links or connections.

Start with existing-user invitation and local-first accepted trip access. This forces the DB permissions and sync model to become solid early. Once that spine is working, invite links and contacts become simpler additions instead of a second system.

## Implementation History

This section records the conversation and implementation path so a future agent can pick up without rediscovering context.

### UI Prototype Pass

- Built the companion screen as a hardcoded prototype first so product decisions could be tested visually.
- Renamed "New Companion" to "Invite companion".
- Removed the accepted badge from accepted companion cards.
- Removed helper text under invited and accepted cards.
- Changed invite link icon from send to copy.
- Changed user search into a modal route.
- Removed the "Max 10" FAB from user search.
- Changed removed/left language to disabled access.

### Remote Model Pass

- Supabase MCP initially could not access the repo-linked Wafflelog project through the generic project list.
- Wafflelog-specific MCP tools became available and were used for direct DB changes.
- User chose direct DB alteration rather than migration files because the app is not live and data is disposable.
- First model attempted to keep membership in `trip_invitation`.
- This caused conceptual naming issues and an RLS recursion error: `infinite recursion detected in policy for relation "trip_invitation"`.
- Model was changed to split invitation lifecycle and membership:
  - `trip_invitation` for invite lifecycle.
  - `trip_member` for who is in the trip.
- Existing accepted/disabled invitation rows were migrated to `trip_member`, then test data was later cleared on request.
- Owner remains on `trip.user_id`; owner is not inserted into `trip_member`.

### Notification Pass

- Invitee had no way to accept or decline an invitation after logging in.
- `app_notification` was wired before companion trip access.
- DB triggers now create invitee notifications for new invites and owner notifications for accepted/rejected responses.
- Notification center now reads real `app_notification` rows.
- Pending trip invite notifications can be accepted or declined.
- Accepting an invite updates `trip_invitation`, marks the notification read, and creates `trip_member`.
- User confirmed accept invite is working.

### Real Companion List Pass

- Companion screen now reads real data:
  - active/disabled companions from `trip_member`.
  - pending invites from `trip_invitation`.
- Pending invite rows can be withdrawn.
- Active companion rows can be disabled.
- Disabled companion rows display as access disabled.
- User search invalidates the real companion list after sending an invite.

### Current Open Design Point

The current home-screen helper `actionListAcceptedCompanionTrips` is inaccurate because it fetches accepted companion trips from Supabase in real time.

Preferred direction:

- Accepted companion trips should sync into the invitee's local SQLite database.
- Relevant pins, checklist items, notes, links, expenses, documents, and images should also be pulled.
- The invitee should be able to open and edit shared trips offline.
- Local-first sync remains acceptable because users generally add/remove their own records rather than co-editing one entity.
