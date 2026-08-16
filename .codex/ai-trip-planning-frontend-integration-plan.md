# AI Trip Planning Frontend Integration Plan

## Status

Functional v1 complete; further work parked on 16 August 2026.

Phases 0–4 have been implemented. The happy path, conversational refinement, atomic import, and same-device recovery have been manually verified. Phase 5 hardening and optional product enhancements are intentionally deferred while other product priorities are addressed.

This document now serves as both the original integration design and the handoff record for resuming the feature later.

## Goal

Add an AI-assisted planning experience in which a signed-in user can:

1. Describe their ideas and constraints for a future trip.
2. Ask the AI planning service to generate a structured draft.
3. Review the itinerary, assumptions, warnings, and research sources.
4. Give conversational feedback and receive revised drafts.
5. Choose which suggestions to keep and make final local edits.
6. Accept the result and create the corresponding Wafflelog trip content.

The AI service produces suggestions only. Wafflelog remains responsible for review, local persistence, synchronization, and all user-owned records.

## Implementation Snapshot

### Completed

- OpenAPI TypeScript generation and a typed authenticated API client.
- Supabase JWT bearer authentication and idempotency keys for mutations.
- Conversational intake for destination, start date, duration, and trip brief, including client-side validation.
- Asynchronous planning-session creation, bounded polling, timeout handling, cancellation, retry, and public progress states.
- Day-grouped draft review with summaries, warnings, recommendation reasons, and research sources.
- Conversational feedback and revised planning jobs.
- A separate final-customization step for selecting itinerary suggestions and checklist items.
- Atomic and idempotent local import of the trip, pins, locations, notes, reference links, and checklist items.
- Navigation to the imported trip followed by normal background synchronization.
- Local planning-session persistence and same-device recovery after navigation, backgrounding, or app termination.
- Automated coverage for the API client, polling helpers, mapping, local persistence, transaction rollback, repeated import, and recovery selection.

### Current boundaries

- Recovery begins only after the create-session response has been received and its session and job IDs have been stored locally. Partially completed intake questions are not persisted.
- Planning history is device-local. It is not restored after reinstalling the app or moving to another device.
- Choosing `Start a new trip` from recovery removes the local recovery record but does not currently cancel a non-terminal backend job.
- Final customization supports including or excluding individual itinerary suggestions and checklist items. It does not yet provide structured edits for the trip title, dates, pin times, or categories.
- General reference links are imported with the accepted trip rather than being individually selectable.
- Documents, images, expenses, and companions are not generated from the current API result.
- A full cross-platform failure, accessibility, and release-readiness pass has not been completed.

## Current Application Architecture

Wafflelog is an Expo and React Native application with an offline-first data flow:

1. User content is written to local SQLite.
2. Local records are marked as pending.
3. The existing synchronization process writes pending records to Supabase.
4. Remote changes are subsequently pulled into SQLite.

The AI planning integration should preserve this design. The planning API must not write directly to Wafflelog's Supabase project or local database.

The application already has local models and synchronization support for:

- trips;
- pins;
- pin locations;
- notes;
- reference links;
- checklist items;
- documents;
- images;
- expenses.

The first AI planning milestone should create trips, pins, locations, notes, reference links, and checklist items. Images, expenses, and file documents are outside the initial result contract.

## OpenAPI Setup

The frontend now uses `openapi-typescript` to generate types from:

```text
https://api.wafflelog.co.uk/openapi.json
```

Types are generated with:

```bash
npm run api:types
```

Generated output:

```text
lib/ai-trip-planning/generated.ts
```

The generated file is a build artifact and should not be edited manually.

## Confirmed API Capabilities

The deployed contract exposes the following operations.

### Create an initial planning session

```http
POST /v1/planning-sessions
```

The request includes:

- destination;
- duration in days;
- freeform trip brief;
- locale;
- an idempotency key header.

The response contains a planning session ID and an initial asynchronous job.

### Submit feedback

```http
POST /v1/planning-sessions/{sessionId}/messages
```

The user submits a freeform feedback message. The API creates a new asynchronous job that produces the next revision.

### Recover a planning conversation

```http
GET /v1/planning-sessions/{sessionId}
```

The response contains:

- the original planning request;
- the user's refinement messages;
- the latest completed revision;
- session timestamps.

### Read job progress

```http
GET /v1/planning-jobs/{jobId}
```

Job states are:

- `queued`;
- `researching`;
- `drafting`;
- `validating`;
- `completed`;
- `failed`;
- `cancelled`.

Polling is the reliable progress mechanism. The current contract does not provide an active SSE URL.

### Cancel a job

```http
DELETE /v1/planning-jobs/{jobId}
```

Cancellation is best-effort. The returned job may already be completed, failed, or cancelled.

## Planning Result

A completed revision contains:

- a versioned schema;
- suggested trip title;
- destination name, country, and timezone;
- duration;
- summary;
- assumptions;
- warnings;
- day-by-day itinerary items;
- suggested locations;
- reasoning and research sources;
- checklist suggestions;
- global reference links.

The frontend should treat the generated result as immutable API data. User inclusion choices and local edits should be maintained separately as review state.

## Proposed User Experience

### Entry point

Add a `Plan with AI` action alongside the existing `New Trip` action on the home screen.

The manual trip-creation flow should remain available and unchanged.

### Initial request screen

Collect:

- destination;
- start date;
- duration;
- freeform ideas, preferences, and constraints;
- locale, defaulted from the device when possible.

The start date must initially be retained by the app because it is not a structured field in the deployed request contract. The frontend may also include it in the trip brief so the planner can consider seasonality.

Submission creates a planning session and navigates to its conversation screen.

### Planning conversation screen

Display:

- the initial request;
- subsequent user feedback messages;
- current job stage and public progress message;
- the latest completed revision;
- retry and cancel actions;
- a feedback composer.

Only one generation or refinement job should be active for a session at a time in the UI.

While a job is running, the app should poll its status. Polling should respect `Retry-After` when available, use a bounded fallback interval, and stop when the job reaches a terminal state.

### Draft review

For the latest completed revision, allow the user to:

- edit the trip title;
- confirm or change the trip start date;
- include or exclude an entire day;
- include or exclude individual suggestions;
- adjust a suggestion's date, time, and Wafflelog category;
- include or exclude checklist suggestions;
- include or exclude reference links;
- inspect assumptions, warnings, descriptions, reasoning, and sources.

Excluding or locally adjusting an item should not automatically submit another AI refinement. A refinement should occur only when the user explicitly sends feedback.

### Acceptance

Before import, show a summary of the records that will be created. The user explicitly confirms the import.

After a successful local transaction:

1. Mark the planning session as imported locally.
2. Invalidate the relevant React Query caches.
3. Navigate to the newly created trip.
4. Allow the existing background synchronization process to upload the records.

## Frontend Architecture

### Typed API client

Create a small API module under `lib/ai-trip-planning/` that:

- consumes types from the generated OpenAPI file;
- uses a configurable base URL;
- sends the current Supabase access token as a bearer token;
- sends a new client-generated idempotency key for each initial request and refinement;
- parses documented success and error responses;
- exposes create-session, refine-session, get-session, get-job, and cancel-job operations;
- normalizes transport and HTTP failures into an application error type.

The proposed runtime configuration name is:

```text
EXPO_PUBLIC_AI_TRIP_PLANNING_API_URL
```

The default production value would be:

```text
https://api.wafflelog.co.uk
```

No LLM, search, or service credentials should be included in the Expo application.

### React Query integration

Use React Query for remote planning state:

- mutations for initial requests, refinements, and cancellation;
- a polling query for the active job;
- a session query for recovery and the current revision;
- explicit cache invalidation after a completed refinement;
- polling disabled when the app has no active job or the job is terminal.

Planning API query keys should be kept separate from local content query keys.

### Local planning state

Persist the minimum recovery and import state in SQLite:

- planning session ID;
- current job ID;
- owning user ID;
- selected start date;
- last-known status and progress message;
- imported trip ID, if any;
- created and updated timestamps.

This permits recovery after backgrounding or restarting the app, provided the session ID was previously stored.

A unique relationship between planning session ID and imported trip ID should make acceptance idempotent. Repeated taps or a retry after an uncertain result must return the existing trip rather than create duplicates.

## Draft-to-Wafflelog Mapping

### Trip

Map:

- result title to trip title, subject to the user's final edit;
- selected start date to trip start date;
- `durationDays` to the inclusive trip end date.

The end date is calculated as:

```text
start date + durationDays - 1 day
```

### Days and dates

Wafflelog does not have a separate persisted trip-day record. Convert each included `dayNumber` to a calendar date relative to the selected start date.

Invalid, duplicated, or out-of-range day numbers should fail validation before import.

### Pins

Each included itinerary item should normally become a pin on its calculated date.

Map:

- item title to pin name;
- calculated date to pin start date;
- suggested start time to pin time when present;
- normalized category to pin category;
- transport details to transport metadata when the API provides enough information.

Estimated duration should not automatically create an end time until the expected behaviour for cross-midnight and range categories is agreed.

### Category normalization

The API category is an unrestricted string, but Wafflelog supports only:

```text
attraction
food
stay
shopping
nature
transport
event
other
```

Apply a deterministic mapper:

- `meal` item type maps to `food`;
- `transport` item type maps to `transport`;
- an exact supported category maps to itself;
- known synonyms may map through an explicit tested lookup table;
- an unknown value maps to `other`.

The review UI should expose the final category so the user can correct it.

### Locations

Create a pin location only when both latitude and longitude are present and valid.

Suggested mapping:

- external place ID to local place ID when supplied;
- otherwise use a stable AI-import identifier based on the planning session and draft item;
- location name to display name;
- search query as the initial formatted-address fallback;
- latitude and longitude unchanged after numeric range validation.

Items without verified coordinates remain valid pins without a pin-location record. A later enhancement could resolve `searchQuery` through the app's place provider during review.

### Notes

Create a pin note containing useful item context, such as:

- description;
- reason for the recommendation.

Create a trip-level note containing:

- plan summary;
- assumptions;
- warnings.

The exact text format should be deterministic and covered by unit tests.

### Reference links

Create:

- item-level reference links for each selected item's sources;
- trip-level reference links for the result's global reference links.

Normalize and deduplicate URLs before insertion. The local reference-link create operation should be extended to accept and preserve the API's meaningful source title instead of always deriving a title from the hostname.

### Checklist items

Create an incomplete checklist item for every included checklist suggestion.

Trim titles and reject empty values before beginning the import transaction.

### Documents

The current API result does not contain downloadable files or document metadata. Wafflelog documents require a real local URI, filename, and MIME type, so no document record should be fabricated in the first milestone.

A future API version could optionally expose an itinerary export endpoint or a downloadable Markdown/PDF artifact. Wafflelog could then import that artifact as a document after an explicit download.

### Unsupported initial entities

Do not create the following from the current planning result:

- expenses;
- images;
- companions.

## Atomic Import

Create a dedicated local operation for materializing an accepted draft.

The operation should:

1. Validate the complete reviewed draft before writing.
2. Start one SQLite transaction.
3. Check whether the planning session was already imported.
4. Create the trip.
5. Create selected pins and locations.
6. Create notes and reference links.
7. Create checklist items.
8. Record the planning-session-to-trip import relationship.
9. Commit only after every write succeeds.

If any write fails, the transaction must roll back and no partial trip should remain.

All generated Wafflelog records should use Wafflelog-owned UUIDs and the normal pending synchronization state.

## Synchronization Considerations

The existing upload flow already synchronizes trips before child records. The AI import should rely on that normal mechanism instead of directly calling Supabase.

After import, the app should invalidate all relevant local query keys so the trip appears immediately, even while offline.

The import operation should not wait for remote synchronization before reporting local success. If synchronization later fails, the existing pending/failed state should remain retryable.

## Error and Recovery Behaviour

The UI should distinguish:

- authentication failure;
- request validation failure;
- planning service unavailability;
- network interruption;
- job failure;
- cancellation;
- local import validation failure;
- local transaction failure.

A network failure while polling must not be interpreted as a failed job. The app should retain the session and job IDs and allow the user to retry or resume.

If the access token expires, use the current Supabase session/refresh behaviour and retry only when it is safe to do so. POST retries must reuse the same idempotency key for the same logical submission.

## API Contract Gaps and Recommendations

### Bearer authentication is not declared in OpenAPI

The endpoints document `401` responses, but the schema does not expose a bearer security scheme. Add an HTTP bearer security definition and attach it to protected operations so generated clients and API documentation describe authentication correctly.

### Start date is not structured

Add an optional ISO date `startDate` to the initial planning request. Date-sensitive recommendations should not depend on extracting a date from prose.

Until then, the frontend should store the date locally and include it in the trip brief.

### Error codes are not stable

Error bodies currently provide only `detail` or `message`. Add a stable error code, for example:

```json
{
  "code": "RATE_LIMITED",
  "detail": "Too many active planning jobs."
}
```

This allows the frontend to show reliable recovery actions without parsing English text.

### Categories are unrestricted

Consider returning a Wafflelog-compatible semantic category enum or a separate normalized category field. Until then, the frontend mapper must handle unknown categories.

### Location address is absent

Consider adding `formattedAddress` to suggested locations. The current frontend must use the search query as a fallback.

### No planning-session list endpoint

The app can recover sessions whose IDs it stores locally, but it cannot discover earlier server-side sessions after a reinstall or local data loss. A future paginated `GET /v1/planning-sessions` endpoint would support cross-device and reinstall recovery.

### No generated document artifact

If AI-created documents are a product requirement, define a separate export contract rather than treating text descriptions as file documents.

## Security and Privacy

- Send only the authenticated Supabase access token required by the API.
- Never store server credentials in the app.
- Treat generated URLs and text as untrusted external content.
- Open links using the app's existing safe web-viewer behaviour.
- Do not render AI output as executable HTML.
- Do not expose internal model reasoning; display only the API's public progress and result fields.
- Associate local planning state with the authenticated user and prevent another signed-in user from reading it.
- Clear or isolate user-specific in-progress planning state during sign-out.

## Testing Plan

### Unit tests

Cover:

- inclusive end-date calculation;
- day-number-to-date conversion;
- category normalization and unknown categories;
- validation of coordinates and times;
- note formatting;
- URL normalization and deduplication;
- API error normalization;
- terminal and non-terminal job-state handling.

### API client tests

Cover:

- bearer authentication;
- idempotency headers;
- documented success responses;
- `401`, `404`, `409`, `422`, and `503` responses;
- network errors;
- polling completion, failure, and cancellation;
- safe retry behaviour.

### SQLite integration tests

Cover:

- successful full import;
- import with excluded days and items;
- all supported entity mappings;
- rollback after a child write fails;
- repeated acceptance returning the existing trip;
- pending records being visible to the current synchronization flow.

### UI and flow tests

Cover:

- initial request submission;
- progress display;
- completed draft review;
- refinement and new revision;
- background/restart recovery;
- cancellation;
- failed jobs and retry;
- offline acceptance;
- successful navigation to the imported trip.

### Contract drift

CI should regenerate the OpenAPI types and fail if committed generated output is stale. Contract changes should be reviewed alongside their frontend mapping impact.

## Delivery Phases

### Phase 0: Contract setup

Status: complete.

- Install `openapi-typescript`.
- Add a repeatable generation command.
- Generate and typecheck the deployed contract.

### Phase 1: API and recovery foundation

Status: complete.

- Add runtime configuration.
- Implement the typed API client.
- Implement job polling.
- Add local planning-session persistence.
- Add client and persistence tests.

### Phase 2: Initial request and progress UI

Status: complete.

- Add the home-screen entry point.
- Build the initial request form.
- Build progress, error, retry, and cancellation states.
- Support resume after navigation or app restart.

### Phase 3: Draft review and conversation

Status: complete for the functional v1 scope. Structured field editing remains an optional enhancement.

- Display the current revision by day.
- Show assumptions, warnings, and sources.
- Add local inclusion and editing controls.
- Add the feedback composer and refinement flow.

### Phase 4: Atomic import

Status: complete.

- Implement and test deterministic mapping.
- Add the idempotent SQLite transaction.
- Invalidate local queries and navigate to the trip.
- Verify background synchronization of every created entity.

### Phase 5: Hardening and release readiness

Status: pending and intentionally parked.

#### Priority 1: lifecycle and release cleanup

- When `Start a new trip` abandons a non-terminal recovered job, make a best-effort cancellation request before deleting its local recovery record.
- Remove remaining user-visible `UI prototype` wording.
- Remove temporary debug logging, including the planning-session response log.
- Review unused prototype-only components and data, removing them only after confirming they have no consumers.
- Decide how long abandoned, failed, and unaccepted local planning sessions should be retained.

#### Priority 2: failure and recovery verification

- Verify initial submission while offline and against `401`, `409`, `422`, `503`, and transport failures.
- Verify that an interrupted or timed-out poll retains the session and can resume safely.
- Verify failed and cancelled initial jobs, including restart and edit-answer paths.
- Verify failed, cancelled, and timed-out refinement jobs without losing the previous completed draft.
- Verify local import validation errors, transaction rollback, repeated confirmation, and offline acceptance.
- Verify that background-sync failure leaves the locally created trip usable and retryable.
- Check expired-token refresh behaviour and confirm logical POST retries reuse their original idempotency key.

#### Priority 3: automated flow coverage

- Add UI or end-to-end coverage for intake, progress, completed review, refinement, recovery after termination, customization, import, and navigation.
- Add a regression flow for abandoning a recovered running job and starting a new plan.
- Keep API health and deployed contract checks in CI rather than in the mobile runtime.

#### Priority 4: accessibility and platform QA

- Verify screen-reader labels, focus order, button states, and announcements for progress and errors.
- Test keyboard avoidance, numeric input, date selection, safe areas, and close-button reachability.
- Test small phones, large phones, and tablets.
- Test supported iOS and Android versions, plus web if the route remains supported there.

#### Priority 5: observability and contract safety

- Add privacy-safe analytics for entry, submission, completion, refinement, recovery, abandonment, and import.
- Add operational error reporting without recording prompts, generated content, access tokens, or other sensitive trip details.
- Regenerate OpenAPI types in CI and fail when committed generated output has drifted.
- Review API contract changes alongside mapping and import behaviour.

### Later enhancements

- SSE progress when the API exposes it.
- Place resolution during review.
- Cross-device planning-session history.
- Shareable or downloadable itinerary documents.
- Collaborative planning sessions.
- Structured editing of the trip title, start date, pin time, and category before import.
- Whole-day inclusion controls and individual selection of general reference links.
- Optional persistence and recovery of partially completed intake answers.

## Initial Acceptance Criteria: Current Status

- [x] A signed-in user can create a planning session.
- [x] The app polls and displays public job progress.
- [x] A stored job survives navigation, backgrounding, and restart on the same device.
- [x] The user can review a completed draft and its sources.
- [x] The user can submit feedback and receive a revised draft.
- [x] The user can exclude individual itinerary suggestions and checklist items during final customization.
- [x] Acceptance creates one local trip with the selected pins, notes, links, locations, and checklist items.
- [x] Import is atomic and idempotent.
- [x] The imported trip is immediately usable from local storage.
- [x] Normal background synchronization uploads the created records.
- [x] Automated tests cover mapping, polling, persistence, rollback, and duplicate acceptance.
- [ ] Complete the full failure, cancellation, accessibility, and cross-platform release-readiness matrix described in Phase 5.

## Resolved and Deferred Decisions

1. The first version keeps `startDate` locally and injects it into the trip brief sent to the API.
2. Itinerary items become pins; their description and recommendation reason are preserved as notes where useful.
3. Estimated duration remains descriptive and does not calculate a pin end time.
4. Suggestions without valid coordinates remain normal pins without a `pin_location` record.
5. The plan summary, assumptions, and warnings are stored together as a deterministic trip-level note.
6. No document is fabricated because the API does not return a downloadable document artifact.
7. Retention of locally persisted, unaccepted planning sessions remains undecided and is listed in Phase 5.

## Recommended Restart Point

When work resumes, start with Phase 5 Priority 1 rather than extending the product surface. Then complete the failure matrix and device QA before considering the optional enhancements. The API contract and SQLite schema do not need to change for the first hardening pass.
