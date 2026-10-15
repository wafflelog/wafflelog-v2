# Wafflelog Monetisation Plan

## Status

Approved product direction; RevenueCat Test Store foundation in progress.

Last reviewed: 14 October 2026.

The first monetisation release is now intentionally narrow: a consumable Trip Assistant Pass sold through RevenueCat. Lifetime Plus, advertising, collaboration limits, web purchases, and advanced abuse prevention are parked until real usage data justifies them.

This document proposes a sustainable first monetisation model for Wafflelog. The immediate goal is not to maximise profit. It is to prevent recurring infrastructure and AI costs from growing faster than revenue while keeping the core product approachable.

## Recommendation

Launch with a useful free product and one consumable `Trip Assistant Pass`. Do not launch a subscription, Lifetime Plus, advertising, or a collaboration paywall in the first monetisation release.

A planning session must be funded before generation starts. The first session for a verified account claims Wafflelog's complimentary allowance; every later session deducts one purchased `TRIPPASS` unit from RevenueCat. A funded session consumes no more than one allowance and includes refinements up to a generous server-configurable safety limit.

A possible later hybrid model may add a one-off `Lifetime Plus` purchase for permanent, low-marginal-cost benefits and restrained advertising for free users. A lifetime purchase must never grant a renewing monthly AI allowance because that would create an unlimited future liability from a single payment.

## Current Delivery Decision

### Launch now

1. Measure the real cost of initial plans and refinements.
2. Establish the RevenueCat purchase foundation.
3. Give each verified account one Wafflelog-owned complimentary planning allowance.
4. Launch one consumable Trip Assistant Pass product.
5. Fund each planning session before generation begins, using the complimentary allowance first and then purchased passes.
6. Keep manual planning and the existing collaboration experience free.
7. Use lightweight, server-configurable rate limits and monitor actual abuse.

### Park until usage data exists

- Lifetime Plus and its exact permanent benefits.
- Free-versus-Plus collaboration limits.
- Advertising and UK/EEA advertising consent.
- Additional pass bundles and volume discounts.
- Web purchases.
- Advanced device attestation or fraud prevention.
- Cross-device planning history, unless payment testing shows that it is required sooner.

The first paid product is the Trip Assistant Pass because the assistant is the feature that creates a direct variable cost. No monthly subscription is proposed.

## Product Principles

- Keep manual trip planning useful without payment.
- Do not hold a user's existing trip data hostage when their pass balance runs out.
- Keep collaboration as a growth mechanism rather than requiring every participant to pay.
- Tie variable-cost AI usage to bounded, paid usage.
- Describe AI usage in traveller-friendly language instead of LLM tokens.
- Explain clearly before a new planning session consumes a purchased pass.
- Make every charge and remaining allowance understandable before the user starts it.
- Enforce entitlements and balances on the server; client-side checks are presentation only.
- Avoid storing prompts, generated content, access tokens, or sensitive trip details in analytics.
- Introduce monetisation incrementally and validate behaviour before optimising revenue.

## Initial Launch Model

| Capability | Free product | Trip Assistant Pass |
| --- | --- | --- |
| Create and manage manual trips | Included | Not applicable |
| Pins, notes, checklists and trip records | Included | Not applicable |
| Send and accept co-edit invitations | Included initially | Not applicable |
| First assistant planning session | Included once per verified account | Not required |
| Later assistant planning sessions | Requires one purchased pass | Funds the complete session |
| Review, accept and create the trip | Included in the funded session | Included |
| Refinements | Included up to the server-configured safety limit | Included in the funded session |

### Free product and complimentary planning allowance

The free version retains Wafflelog's core value:

- manual trip creation and organisation;
- pins, notes, checklists, expenses, images, documents and links;
- the existing collaboration experience;
- one complimentary Trip Assistant planning session for a verified account.

The complimentary allowance is stored and enforced by Wafflelog rather than granted as RevenueCat In-App Currency. It is claimed when the first planning session begins, does not refresh monthly and is shared across devices through the authenticated account. Server-side rate limits and usage monitoring remain necessary because per-account allowances can be bypassed with disposable accounts.

### Trip Assistant Pass

The Trip Assistant Pass is a consumable in-app purchase. After the complimentary allowance has been used, the planning API deducts one `TRIPPASS` unit before accepting a new planning session for generation. That session cannot consume another pass.

Purchased passes do not expire. The product should use the traveller-friendly name `Trip Assistant Pass` rather than LLM tokens, AI credits or generation packs.

A funded session may receive refinements without another charge, subject to a generous server-configurable safety limit. Validation failures, polling retries and recoverable technical failures reuse the same funded session. A terminal technical failure that leaves the session permanently unusable releases the complimentary claim or issues one idempotent `TRIPPASS +1` compensating transaction. This is a pass credit reversal, not a monetary store refund.

### Later product options

Lifetime Plus remains a possible non-consumable purchase for permanent, low-marginal-cost benefits such as advertising removal, enhanced organisation features or higher collaboration limits. Its price and feature bundle are deliberately undecided.

If collaboration becomes a Plus benefit, the architecture should support a server-provided limit such as zero, one or unlimited owner-created collaborative trips. Invitees should remain able to accept and edit without paying. Existing collaborators and pending invitations must be grandfathered rather than revoked.

## Advertising

Advertising is not part of the first monetisation release. It may later be considered supplementary income rather than the mechanism that funds assistant usage.

Recommended placements:

- the home or trip-list screen;
- low-focus informational screens;
- an optional empty state where it does not obstruct a primary action.

Avoid advertising in:

- the AI intake conversation;
- job progress and error screens;
- AI draft review and final confirmation;
- maps and navigation-focused screens;
- forms, dialogs, keyboards, and destructive-action confirmations;
- a shared trip where it would crowd collaborator actions.

Begin with one restrained banner placement. Measure revenue, retention, upgrade conversion, and layout impact before expanding.

For UK and EEA users, the advertising implementation must include an appropriate consent-management flow, privacy disclosures, and a way to revisit privacy choices. Non-personalised advertising may reduce tracking, but it does not eliminate all compliance work.

## Trip Assistant Pass Charging Rules

The planning API must be the enforcement point because the Expo client, local SQLite database, and UI state can be modified by a user.

Initial lifecycle:

1. The API validates the Supabase JWT, derives the user UUID from it and creates or resolves the idempotent planning session.
2. Before generation begins, the API checks whether that session is already funded.
3. If not funded, it atomically claims the user's complimentary allowance when still available.
4. Otherwise it deducts one `TRIPPASS` through RevenueCat using a deterministic session debit idempotency key.
5. Only after the funding operation succeeds does the API accept the session for generation.
6. Refinements and recoverable retries reuse the existing funded session and never deduct another pass.
7. A terminal technical failure with no usable result releases the complimentary claim or sends one idempotent `TRIPPASS +1` compensating transaction.
8. The API records the funding source, debit and reversal state for audit and recovery.

Recommended initial charging policy:

- no allowance is claimed for local validation, authentication or request-validation failures;
- no duplicate debit or credit for an idempotent retry;
- closing the app, losing the polling connection or abandoning an accepted session does not reverse its funding;
- recoverable generation failures keep the session funded and allow retry without another charge;
- only a terminal server failure with no usable result and no recovery path reverses the pass;
- user dissatisfaction with a draft uses the included refinements and is not an automatic reversal;
- customer-support adjustments use audited transactions rather than directly overwriting a balance.

Every credit mutation must be idempotent and auditable.

## Unit Economics

### Measure before fixing prices

Record the following for every planning job without retaining its prompt or generated content in analytics:

- job and planning-session identifiers;
- initial plan or refinement;
- model and model version;
- input, cached-input, and output token counts;
- external research or tool-call costs;
- job runtime;
- completed, failed, or cancelled status;
- estimated variable cost;
- whether and why a pass was consumed;
- whether the session was accepted or abandoned.

Measure initial generations and refinements separately. They may have very different cost profiles.

Useful metrics include:

- median and 95th-percentile initial-generation cost;
- median and 95th-percentile refinement cost;
- average revisions per completed planning session;
- failure rate after pass consumption;
- total variable cost per imported trip;
- monthly Fly.io, Cloudflare, database, monitoring, and support costs.

### Price floor

For a bounded Trip Pass:

```text
maximum expected pass cost
= initial generation cost
+ maximum included refinement cost
+ external research/tool cost
+ allocated variable infrastructure cost
```

A simplified price floor is:

```text
minimum store price
= (maximum expected pass cost + allocated fixed cost)
/ expected net store percentage
```

If net proceeds are approximately 85% after an applicable 15% store fee, divide the cost requirement by `0.85` before adding a safety margin. Actual proceeds vary by store programme, region, tax treatment, refunds, and future policy changes, so real store statements must replace this planning assumption.

The price should also include a buffer for:

- high-cost but valid jobs;
- failed work and support adjustments;
- customer support and purchase disputes;
- monitoring and observability;
- model-price changes;
- low initial sales volume sharing the fixed hosting cost.

### Break-even tracking

Track contribution separately for each product:

```text
Trip Assistant Pass contribution
= net purchase proceeds
- AI and research cost consumed by that pack
- attributable infrastructure and support cost
```

```text
monthly break-even purchases
= remaining monthly fixed cost
/ average contribution per purchase
```

Advertising revenue should reduce the remaining fixed cost in this calculation. It should not be assumed to pay for unbounded AI usage.

## Pricing Hypotheses

These are starting hypotheses for research and store experiments, not committed prices:

- Complimentary planning allowance: one funded planning session per verified account, stored by Wafflelog rather than RC.
- Purchased session: one `TRIPPASS` funds one new planning session and its included refinements.
- Trip Pass: priced from measured maximum expected cost rather than competitor pricing alone.
- Later multi-pass bundles: a modest per-pass discount without falling below the required contribution margin.

Lifetime Plus pricing is intentionally deferred until its benefits and demand are supported by usage data.

Current travel-app subscriptions provide useful willingness-to-pay context but should not determine Wafflelog's structure. Wanderlog advertises Pro from $39.99 per year, TripIt Pro is $49 per year, and Layla lists monthly and annual AI subscriptions. Wafflelog's one-off-plus-consumables model is intentionally different because it matches episodic travel planning and variable AI costs.

## Technical Architecture

### Store products

The first release needs one product class:

- `wafflelog_trip_assistant_pass_1`: a consumable product that grants one `TRIPPASS` unit.

Use the same logical product catalogue across Apple and Google while retaining their platform-specific product identifiers. Lifetime Plus and multi-pass bundles are later additions rather than first-release dependencies.

### Purchase provider

RevenueCat is the recommended first integration because it can unify StoreKit and Google Play Billing, validate purchases, expose entitlements, and publish webhooks.

Use the authenticated Supabase user UUID as the stable RevenueCat app user ID. Define and test account-switching, sign-out, restore-purchase and multi-device behaviour before release.

Configure RevenueCat only after the authenticated Supabase UUID is available. Prefer identified customers rather than anonymous RevenueCat users. When switching between Wafflelog accounts on one device, identify the next Supabase UUID directly and ensure that the previous account's entitlements or balances cannot appear in the new account.

Real in-app purchase testing requires an Expo development build. Expo Go can be used for UI previewing but not for completing real store transactions.

### Entitlement storage

No RevenueCat entitlement or webhook is required for the first Trip Assistant Pass release. RevenueCat remains authoritative for purchased `TRIPPASS` balances. Wafflelog remains authoritative for the once-per-account complimentary allowance and each planning session's funding state. The planning API authenticates the Supabase JWT and uses its UUID as the RevenueCat customer ID.

If Lifetime Plus is introduced later, it can be represented by a RevenueCat entitlement and optionally mirrored into a server-owned entitlement table for fast backend decisions.

Do not use user-editable Supabase `user_metadata` for authorisation. If an entitlement is mirrored into Supabase, it should be written only by a trusted webhook or backend and checked directly during the protected operation.

If collaboration limits are introduced later, the invitation or collaboration-enablement operation must check a server-provided capability or limit. Existing collaborator permissions can continue to determine whether an invited user may edit after access has legitimately been granted.

### Credit ledger

Use RevenueCat In-App Currency as the source of truth for purchased Trip Assistant Pass balances. RevenueCat grants currency from verified consumable purchases, rejects spending when the balance is insufficient and supports idempotent backend adjustments. Complimentary usage is intentionally excluded from RevenueCat so its balance and purchase analytics represent paid passes only.

Represent one purchased planning allowance as one `TRIPPASS` unit. Only the trusted planning backend may spend or adjust this balance through RevenueCat's secret-key API. The Expo application may display the balance but must never receive the secret key or be able to mutate the balance directly.

The planning API should still retain compact audit and reconciliation records containing:

- RevenueCat customer ID, derived from the Supabase UUID;
- planning session and job IDs;
- funding source: `complimentary` or `revenuecat`;
- state: charged or reversed;
- deterministic debit and reversal idempotency keys;
- RevenueCat transaction references when applicable;
- charge, reversal and reconciliation timestamps;
- terminal-failure reason when a pass is reversed.

This record is not a second customer balance. RevenueCat remains authoritative, while the planning service records why the pass was spent and can recover safely from partial failures.

If RevenueCat In-App Currency is unavailable or unsuitable when implementation resumes, the fallback is an append-only Wafflelog-owned ledger with unique provider transaction IDs and logical idempotency keys.

### Planning API changes

The planning service will need to:

- authenticate the Supabase JWT and derive the RevenueCat customer from the Supabase UUID;
- atomically claim the complimentary allowance at most once per verified account;
- fund a new session before generation through the complimentary allowance or a `TRIPPASS -1` RevenueCat transaction;
- persist the session's funding source and charge or reversal state;
- use deterministic RevenueCat idempotency keys for both debit and compensating credit;
- ensure concurrent session-creation requests cannot claim the complimentary allowance or overspend purchased passes;
- return the existing payment state when an idempotent request is repeated;
- keep recoverable retries attached to the funded session;
- reverse funding exactly once after a terminal technical failure with no usable result;
- return stable error codes for insufficient balance and purchase-required states.

Potential error codes:

```text
TRIPPASS_REQUIRED
TRIPPASS_DEBIT_FAILED
TRIPPASS_REVERSAL_FAILED
PLANNING_SESSION_ALREADY_FUNDED
```

Do not place RevenueCat secret keys, Supabase service-role credentials, OpenAI keys, or ledger mutation capability in the Expo application.

## Cost Controls

Even with paid credits, protect the service from unexpectedly expensive jobs:

- retain strict destination, duration, and prompt-length limits;
- set model input and output limits;
- keep the per-session refinement safety limit server-configurable;
- apply a generous hard safety limit after a session is paid;
- rate-limit planning jobs per user and account;
- prevent concurrent active jobs where the product does not support them;
- use structured output and deterministic validation to reduce retries;
- consider a lower-cost model for suitable refinement or validation work;
- test cheaper models against a fixed quality evaluation set before switching;
- monitor cost by model version and deploy a server-side kill switch;
- never advertise unlimited AI while the cost remains usage-based.

## Implementation Roadmap

### Phase 0: freeze the product rules and measure cost

- Add privacy-safe cost telemetry to the separate planning API.
- Measure initial plans and refinements separately across representative trip lengths.
- Calculate median, 95th-percentile and maximum observed session cost.
- Confirm the once-per-verified-account complimentary planning allowance.
- Define the post-payment safety limit and lightweight new-session rate limit.
- Grandfather planning sessions created before charging is enabled.
- Select the first price only after cost data is usable.

The accepted initial charging rule is: fund the planning session before generation begins, use the complimentary allowance first, otherwise deduct one purchased pass, and never charge the session twice.

Estimated development effort: 1–2 days, followed by cost-data collection.

### Phase 1: store and RevenueCat configuration

- Complete Apple and Google merchant, banking, and tax configuration.
- Enrol in applicable small-developer fee programmes.
- Create the RevenueCat project and its iOS and Android apps.
- Configure `TRIPPASS` as an in-app currency.
- Create a consumable product such as `wafflelog_trip_assistant_pass_1`.
- Create a RevenueCat offering that grants one Trip Pass.
- Begin with RevenueCat Test Store, then configure Apple and Google sandbox products.

Current progress: the Test Store product, Offering and `TRIPPASS` currency are configured, and one test purchase has completed successfully.

Estimated development effort: approximately 1 day, excluding external account and approval delays.

### Phase 2: RevenueCat client foundation

- Install a pinned `react-native-purchases` version that supports both RevenueCat Test Store and In-App Currency. Version 9.5.4 or later is required by the currently reviewed documentation.
- Add `react-native-purchases-ui` only if RevenueCat's paywall or Customer Center is used.
- Add platform RevenueCat public API keys to `.env.example` and the build configuration.
- Rebuild the Expo development client.
- Configure RevenueCat after the Supabase session is known.
- Use the Supabase UUID as the RevenueCat App User ID; never use an email address.
- Add TanStack Query hooks for offerings, localised prices, customer information and Trip Pass balance.
- Add purchase and restore mutations.
- Invalidate RevenueCat's currency cache after a purchase or backend spend before refetching the balance.
- Handle account switching and prevent cross-account entitlement leakage.

Current progress: `react-native-purchases` is installed, RevenueCat initializes against the authenticated Supabase UUID, the current Offering and `TRIPPASS` balance are readable, and the Test Store purchase flow is validated in development.

Estimated development effort: 1–2 days.

### Phase 3: planning API funding and enforcement

- Authenticate the Supabase JWT and derive the RevenueCat customer from the Supabase UUID.
- Persist one funding record per planning session with source, state, debit and reversal details.
- Atomically claim the complimentary allowance at most once per verified Supabase user.
- Deduct one `TRIPPASS` before generation for later sessions.
- Use deterministic debit and reversal keys with RevenueCat's `Idempotency-Key` header.
- Begin generation only after the funding operation succeeds.
- Make the funding transition concurrency-safe so simultaneous requests cannot claim or spend twice.
- Return the existing session and funding state for duplicate logical requests.
- Keep recoverable failures attached to the funded session and allow retry without another charge.
- Release a complimentary claim or issue `TRIPPASS +1` exactly once after a terminal technical failure with no usable result.
- Return stable errors such as `TRIPPASS_REQUIRED`, `TRIPPASS_DEBIT_FAILED`, `TRIPPASS_REVERSAL_FAILED` and `PLANNING_SESSION_ALREADY_FUNDED`.
- Update the OpenAPI contract and regenerate the frontend TypeScript types.
- Verify that direct API calls cannot bypass funding.

Estimated development effort: 3–5 days in the planning API project.

### Phase 4: payment UI

- Add a reusable Wafflelog-styled purchase or paywall modal route.
- Display localised product names and prices from the store rather than hardcoding them.
- Explain clearly what one Trip Pass includes.
- Display the current Trip Pass balance.
- Explain whether the next planning session uses the complimentary allowance or a purchased pass.
- Open the purchase UI before creating a new session when the complimentary allowance is unavailable and the purchased balance is zero.
- Resume the original session-creation action after a successful purchase.
- Handle loading, user cancellation, pending purchase, unavailable product, failure, and success states.
- Add Restore Purchases and purchase status to Settings.
- Include required legal and privacy links before store submission.

Estimated development effort: 1–2 days.

### Phase 5: connect the AI-planning frontend

- Show the complimentary allowance or purchased Trip Pass balance before creating a planning session.
- Keep the planning API authoritative even when the client believes a pass is available.
- Use the server-returned refinement safety limit rather than hardcoding it in the client.
- Open the purchase UI when the API returns `TRIPPASS_REQUIRED`.
- Refresh the balance after purchase and retry safely.
- Display that refinements and recoverable retries remain part of the funded session.
- If local import fails, retry it against the already-funded session without another charge.
- Preserve the current polling, cancellation, recovery, review, and local import behaviour.
- Confirm that refinements, acceptance and repeated import attempts do not spend another pass.

Estimated development effort: 1–2 days.

### Later phase: Lifetime Plus and collaboration

Do not start this phase until real collaboration usage, invitation conversion and willingness-to-pay data are available.

- Create `wafflelog_plus_lifetime` as a non-consumable product.
- Define a RevenueCat `plus` entitlement.
- Add a RevenueCat webhook endpoint with HMAC validation and event-ID replay protection.
- Mirror Plus into a server-owned Supabase entitlement table with RLS and no client mutation path.
- Add an authenticated entitlement-sync endpoint so a new purchase does not depend solely on webhook delivery time.
- Show Plus state, purchase, and restore controls in Settings.
- Decide whether Free supports zero, one or unlimited owner-created collaborative trips.
- Enforce the chosen collaboration capability in a trusted server or database operation.
- Preserve accepted collaborators and decide how pending invitations and existing free owners are grandfathered.
- Apply later low-marginal-cost Plus benefits, including ad removal when advertising exists.

Estimated development effort: 3–5 days.

### Phase 6: sandbox testing and controlled rollout

- Test first with RevenueCat Test Store.
- Test real iOS purchases through Apple Sandbox and TestFlight.
- Test real Android purchases through Google Play internal testing.
- Verify purchase, cancellation, pending, restore, reinstall, multiple-device and account-switching flows.
- Verify complimentary claims, purchased-pass debits, concurrent submissions and idempotent retry.
- Verify that funded sessions cannot be charged again and terminal reversals cannot be credited twice.
- Release to a small audience and monitor purchase failures, balance discrepancies, AI contribution, and support demand.

Estimated development effort: 2–3 days, excluding store review and propagation delays.

### Later phase: advertising

Do not start this phase until Wafflelog has enough active usage to estimate likely advertising revenue and retention impact.

- Select an Expo-compatible advertising SDK.
- Add the UK/EEA consent-management and privacy-settings flows.
- Implement one restrained banner placement.
- Suppress advertising for Plus users.
- Measure whether revenue justifies the UX and compliance cost before expanding placements.

Advertising is not part of the initial payment integration estimate.

### Overall estimate

- Trip Assistant Pass payment MVP: approximately 8–13 focused development days.
- Frontend and RevenueCat client: approximately 3–5 days.
- Planning API funding and reversal work: approximately 3–5 days.
- Cross-platform sandbox and release testing: approximately 2–3 days.
- Lifetime Plus, collaboration gating and advertising are excluded from the initial estimate.

External Apple and Google account setup, product approval and cost-data collection are not included in these estimates.

## Testing Requirements

### Initial purchase flow

- successful consumable purchase;
- user cancellation and pending purchase;
- RevenueCat Test Store, Apple Sandbox and Google Play internal-test purchases;
- account switching on one device;
- the same Supabase account on another device;
- reinstalling and identifying the same Supabase account;
- purchase made while the app loses connectivity;
- price and product unavailable in a region;
- balance cache invalidation after purchase and backend spend.

### Pass consumption

- one complimentary planning allowance per verified account;
- reinstalling or changing devices does not recreate the complimentary allowance;
- the first planning session atomically claims the complimentary allowance before generation;
- later planning sessions deduct one purchased `TRIPPASS` before generation;
- refinements, acceptance and local import attempts do not charge the funded session again;
- validation and authentication failures do not claim or deduct a pass;
- recoverable generation failures and technical retries retain the funded session;
- terminal technical failures with no usable result reverse the funding exactly once;
- a pass reversal restores `TRIPPASS` but does not issue a monetary store refund;
- concurrent planning requests cannot overspend;
- an idempotent API retry debits or credits once;
- insufficient balance opens the purchase flow before session creation;
- support adjustments remain auditable;
- the client cannot directly increase or spend its balance.

### Deferred Lifetime Plus and collaboration tests

- the configured Free collaboration limit is enforced by a trusted operation;
- a Plus owner receives the configured higher collaboration limit;
- invited free users can edit the permitted trip;
- collaborators cannot enable access for unrelated trips;
- existing collaborators and pending invitations are grandfathered;
- entitlement refund or revocation follows the documented lifetime-product policy;
- RLS and server checks prevent direct API bypass.

### Deferred advertising and privacy tests

- ads are absent for Plus users;
- ads never appear in excluded high-focus screens;
- UK/EEA consent is collected before eligible personalised advertising;
- refusing or changing consent is respected;
- the privacy-settings control remains accessible;
- ad loading failure does not move or block core content;
- accessibility and small-screen layouts remain usable.

## Metrics

Track the following without prompt or itinerary contents:

- complimentary-allowance claim and reversal;
- purchased-pass debit and reversal;
- session funding source: complimentary or RevenueCat;
- draft-to-acceptance conversion;
- funded-session abandonment rate;
- Trip Assistant Pass purchase conversion;
- average successful refinements per funded session;
- cost per initial plan, refinement, completed session, and imported trip;
- gross and contribution revenue per pass;
- planning failure and abandonment rate;
- purchase failures, restores, disputes, and support contacts.

Continue measuring collaboration invitations and acceptances so a later Lifetime Plus decision can be based on usage. Add Plus conversion and advertising metrics only if those products enter active development.

The primary early business metric should be contribution after AI cost, not gross purchase revenue.

## Risks and Mitigations

### Users create disposable accounts for complimentary sessions

Mitigation: require verified accounts, claim the complimentary allowance remotely once, use lightweight account and network rate limits, and monitor actual abuse before introducing device attestation or additional friction.

### The charging boundary feels surprising

Mitigation: explain before planning begins whether the session uses the complimentary allowance or one purchased pass, show the remaining paid balance and require confirmation before a paid session starts.

### Users call the planning API directly

Mitigation: authenticate every request and perform the complimentary claim or RevenueCat debit in the planning API before generation begins. Never trust client-supplied user IDs, pass balances or payment state.

### Lifetime purchase creates unexpected ongoing cost

Mitigation: keep recurring assistant usage outside Lifetime Plus, constrain storage-heavy future benefits, and define the permanent entitlement precisely before launching it.

### Ads weaken the product experience

Mitigation: begin with one restrained placement, exclude planning and trip-critical screens, and remove ads permanently with Plus.

### Collaboration paywall slows growth

Mitigation: keep current collaboration free during the initial payment release. If limits are introduced later, let invited companions participate free and grandfather existing relationships.

### Client or API abuse creates uncharged AI work

Mitigation: perform pass spending in the planning backend, use authenticated user IDs, enforce rate limits, and make the one session charge idempotent and concurrency-safe.

### Model or provider pricing changes

Mitigation: retain hard limits, model-routing controls, cost monitoring, a server kill switch, and remotely configurable product allowances where possible.

## Remaining Decisions Required Before Implementation

1. What is the first Trip Assistant Pass price after measured cost and store fees?
2. What generous hard refinement safety limit applies to each funded session?
3. What lightweight new-session rate limit should apply at launch?
4. How long should completed but not locally imported server sessions remain recoverable?
5. Is the initial purchase UI custom-built or RevenueCat Paywalls?

Later decisions, deliberately excluded from the initial release:

6. What benefits and price would make Lifetime Plus valuable?
7. Does Free allow zero, one or unlimited owner-created collaborative trips after Plus launches?
8. How are early users, existing collaborators and pending invitations grandfathered?
9. Does advertising produce enough value to justify its UX and consent cost?
10. Will web purchases be supported?

## Confirmed Initial Decisions

1. Launch the Trip Assistant Pass before Lifetime Plus or advertising.
2. Give each verified account one Wafflelog-owned complimentary planning allowance once.
3. Claim the complimentary allowance before the account's first planning session begins generation.
4. Deduct one purchased `TRIPPASS` before every later planning session begins generation.
5. Never consume more than one allowance for the same planning session.
6. Keep recoverable failures and technical retries attached to the funded session.
7. Purchased passes do not expire.
8. Use RevenueCat as the authoritative purchased `TRIPPASS` balance.
9. Spend passes only through the trusted planning API.
10. Reverse funding only for a terminal technical failure with no usable result or recovery path.
11. Use an idempotent `TRIPPASS +1` adjustment for a purchased-pass reversal; this is not a monetary refund.
12. Keep the existing collaboration experience free during the initial release.
13. Defer Lifetime Plus, collaboration limits, advertising, multi-pass bundles and web purchases until real usage data exists.
14. Implement cost measurement before setting the pass price.

## Resume Point

When payment implementation begins:

1. Re-check current Apple, Google, Expo, RevenueCat, and Supabase documentation and pricing.
2. Confirm that the app's UI, E2E tests, authentication, notifications, and AI-planning happy path remain stable.
3. Implement privacy-safe planning-cost telemetry.
4. Decide the pass price, funded-session safety limit and lightweight session rate limit.
5. Treat the RevenueCat Test Store product, Offering, customer identity, balance read and test purchase as completed foundations.
6. Implement the planning API's funding record, complimentary claim, `TRIPPASS` debit and terminal-failure reversal before building the production payment UI.

Do not begin by gating collaboration, adding advertising or building Lifetime Plus. Establish and test the Trip Assistant Pass vertical slice first.

## Reference Material

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple in-app purchase product types](https://developer.apple.com/documentation/storekit/original-api-for-in-app-purchase)
- [Apple App Store Small Business Program](https://developer.apple.com/app-store/small-business-program/)
- [Google Play one-time product types](https://support.google.com/googleplay/android-developer/answer/14590082?hl=en-EN)
- [Google Play service fees](https://support.google.com/googleplay/android-developer/answer/112622?hl=en)
- [RevenueCat Expo integration](https://www.revenuecat.com/docs/getting-started/installation/expo)
- [RevenueCat customer identity](https://www.revenuecat.com/docs/customers/identifying-customers)
- [RevenueCat In-App Currency](https://www.revenuecat.com/docs/offerings/virtual-currency)
- [RevenueCat In-App Currency source of truth](https://www.revenuecat.com/docs/offerings/virtual-currency/faq/balance-source-of-truth)
- [RevenueCat Test Store](https://www.revenuecat.com/docs/test-and-launch/sandbox/test-store)
- [RevenueCat webhook security and delivery](https://www.revenuecat.com/docs/integrations/webhooks)
- [RevenueCat pricing](https://www.revenuecat.com/pricing)
- [Google AdMob consent management](https://support.google.com/admob/answer/7666519?hl=en)
- [Wanderlog Pro](https://wanderlog.com/pro)
- [TripIt Pro pricing](https://www.tripit.com/web/pro/pricing)
- [Layla App Store listing](https://apps.apple.com/us/app/layla-ai-trip-planner/id6758730467)
