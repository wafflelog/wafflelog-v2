# Wafflelog Analytics Tracking Plan

## Status

Initial launch scope agreed.

Last reviewed: 13 October 2026.

Firebase Analytics is configured for the development app. Manual screen-view
events have been validated in the Google Analytics dashboard.

## Objective

The first analytics release should answer a small number of useful product
questions:

- Do new users reach their first useful trip?
- Does the trip assistant produce drafts that users accept?
- Do invitations lead to real collaboration?

Wafflelog should not track every tap. Events must support a defined decision or
funnel; otherwise they should not be added.

## Funnel 1: Activation

```text
first_open
→ sign_up
→ email_verified
→ trip_created
→ trip_item_created
```

`first_open` is collected automatically by Firebase. A user is considered
activated after creating a trip and adding at least one meaningful item.

| Event | Trigger | Parameters |
| --- | --- | --- |
| `sign_up` | Registration succeeds | `method: email` |
| `email_verified` | Email confirmation succeeds | `method: email` |
| `trip_created` | A trip is saved | `creation_method`, `has_start_date` |
| `trip_item_created` | A trip item is saved | `item_type`, `source`, optional `user_role` |

Allowed values:

- `creation_method`: `manual`, `assistant`
- `item_type`: `pin`, `checklist`, `expense`, `image`, `document`, `link`, `note`
- `source`: `manual`, `assistant_import`
- `user_role`: `owner`, `companion`

`user_role` remains optional until the collaboration instrumentation can obtain
the role from reliable trip-membership context. It must not be guessed.

## Funnel 2: Trip assistant

The primary product question is:

> Is the trip assistant useful and sufficiently aligned with what users expect?

```text
trip_assistant_started
→ trip_assistant_draft_generated
→ trip_assistant_refinement_requested (optional)
→ trip_assistant_plan_accepted
```

Failures are recorded separately so an abandoned session can be distinguished
from a technical failure.

| Event | Trigger | Parameters |
| --- | --- | --- |
| `trip_assistant_started` | A new or unfinished session is opened | `entry_point`, `resumed` |
| `trip_assistant_draft_generated` | A usable draft is returned | `draft_type`, `duration_bucket` |
| `trip_assistant_refinement_requested` | The API accepts a request to revise a draft | None |
| `trip_assistant_plan_accepted` | The draft is accepted and imported | `selected_item_count_bucket`, `refinement_count_bucket` |
| `trip_assistant_failed` | Planning or import fails | `stage`, `reason` |

Allowed values:

- `entry_point`: `home`, `unfinished_plan`
- `draft_type`: `initial`, `refinement`
- `stage`: `create`, `generate`, `poll`, `refine`, `import`
- `reason`: `network`, `timeout`, `authentication`, `server`, `validation`, `unknown`

`generate` identifies a planning job that failed on the service. `poll` is
reserved for client-side retrieval failures and polling timeouts. User-requested
cancellation is not recorded as a failure.

The destination, trip brief, refinement feedback, and generated content must
never be sent to analytics.

### Assistant quality measures

- **First-draft acceptance rate:** accepted plans with zero refinements divided
  by generated initial drafts.
- **Refinement rate:** users requesting at least one change divided by users
  receiving a draft.
- **Post-refinement acceptance rate:** refined plans eventually accepted divided
  by plans where a refinement was requested.
- **Abandonment after draft:** drafts followed by neither refinement nor
  acceptance.
- **Refinement-count distribution:** the bucket recorded when the user accepts
  a plan.

Refinement is a useful proxy for alignment, but it is not a perfect accuracy
measure. A user may request a change because their preference changed rather
than because the draft was wrong. Acceptance, refinement, and abandonment
together provide the initial quality signal.

### Monetisation relevance

These events connect assistant usefulness to unit economics:

- first-draft acceptance indicates the lowest model cost per useful trip;
- refinements followed by acceptance show that conversational revision adds
  value;
- refinements followed by abandonment indicate model cost without a useful
  outcome;
- the refinement-count distribution helps define a sensible revision allowance
  for a future AI Trip Pass.

Analytics measures behaviour only. Server-side planning-job usage remains the
authoritative source for token cost, credits, and billing.

## Funnel 3: Collaboration

```text
trip_invite_sent
→ trip_invite_responded: accepted
→ trip_item_created: companion
```

| Event | Trigger | Parameters |
| --- | --- | --- |
| `trip_invite_sent` | An in-app invitation is created | `channel: in_app` |
| `trip_invite_responded` | The invitation is accepted or rejected | `outcome` |

Allowed values:

- `outcome`: `accepted`, `rejected`

An accepted invitation alone does not prove collaboration. A later
`trip_item_created` event with `user_role: companion` shows that the companion
contributed to the trip. Invitation sending and response tracking are complete;
reliable companion-contribution attribution remains deferred.

## Screen tracking

Track a `screen_view` whenever the visible Expo Router route changes. Screen
names must use stable route templates rather than real entity identifiers:

```text
home
trip/[tripId]
pin/[pinId]
settings
ai-trip-planner
```

## Privacy and data quality rules

Never send:

- email addresses, usernames, or other personal identifiers;
- trip names, destinations, place-search text, notes, or checklist text;
- prompts, refinement feedback, or generated assistant content;
- trip, pin, notification, or database IDs;
- expense amounts;
- filenames, document URLs, or raw error messages.

Use fixed enum values and buckets instead of unrestricted strings. This keeps
reports readable and avoids high-cardinality dimensions.

Do not set Firebase User-ID for the initial release. If cross-device analytics
is introduced later, use only an internal identifier, clear it on logout, and
first confirm the privacy-notice and consent requirements.

## Reporting

Review these measures first:

- activation conversion from sign-up to first trip item;
- assistant draft-generation and acceptance conversion;
- assistant failure rate by stage and reason;
- invitation acceptance rate;
- percentage of accepted invitations followed by companion activity;
- 7-day and 28-day return activity involving a meaningful planning action.

Supabase remains the authoritative source for total users, trips, invitations,
and stored content. Analytics is used for behavioural funnels and trends.

## Implementation sequence

1. **Complete:** validate manual screen-view events in Google Analytics.
2. Add a central, typed event catalogue and safe tracking helpers.
3. **Complete:** instrument the activation funnel.
4. **Complete:** instrument the trip-assistant funnel.
5. **Complete:** instrument the invitation lifecycle in the collaboration funnel.
6. Review the collected data before adding more events.

## Deferred events

The following are deliberately outside the first-launch scope:

- notification permission and notification-open funnels;
- detailed sync and media telemetry;
- individual button presses and form-field interactions;
- search terms and destination popularity;
- monetisation and purchase funnels;
- user properties and cross-device User-ID tracking.

