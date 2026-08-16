# Wafflelog Monetisation Plan

## Status

Draft for review.

Last updated: 16 August 2026.

This document proposes a sustainable first monetisation model for Wafflelog. The immediate goal is not to maximise profit. It is to prevent recurring infrastructure and AI costs from growing faster than revenue while keeping the core product approachable.

## Recommendation

Use a hybrid model made up of:

1. A useful free product, optionally supported by restrained banner advertising.
2. A one-off `Lifetime Plus` purchase for permanent non-AI benefits.
3. Consumable `AI Trip Passes` or `AI Generations` for usage that creates a variable cost.

A one-off purchase must not grant a renewing monthly AI allowance. Five new AI requests every month would create an unlimited future liability from a single payment. Lifetime Plus may include a fixed one-time AI bonus, but all later AI usage should be funded by another purchase or another recurring source of revenue.

## Product Principles

- Keep manual trip planning useful without payment.
- Do not hold a user's existing trip data hostage after a purchase expires or credits run out.
- Keep collaboration as a growth mechanism rather than requiring every participant to pay.
- Tie variable-cost AI usage to bounded, paid usage.
- Describe AI usage in traveller-friendly language instead of LLM tokens.
- Make every charge and remaining allowance understandable before the user submits a job.
- Enforce entitlements and balances on the server; client-side checks are presentation only.
- Avoid storing prompts, generated content, access tokens, or sensitive trip details in analytics.
- Introduce monetisation incrementally and validate behaviour before optimising revenue.

## Proposed Product Tiers

| Capability | Free | Lifetime Plus | AI purchase |
| --- | --- | --- | --- |
| Create and manage manual trips | Included | Included | Not applicable |
| Pins, notes and checklists | Included | Included | Not applicable |
| View a shared trip | Included | Included | Not applicable |
| Enable co-editing on an owned trip | Limited or unavailable | Included | Not applicable |
| Edit a trip owned by a Plus user | Included | Included | Not applicable |
| Banner advertising | May be shown | Removed permanently | Unchanged |
| Introductory AI planning | One bounded trial | Same trial, optionally with a one-time bonus | Not applicable |
| Further AI drafts and revisions | Requires purchase | Requires purchase after any fixed bonus | Consumes a Trip Pass or generation balance |

### Free

The free version should retain Wafflelog's core value:

- manual trip creation and organisation;
- pins, notes and checklists;
- viewing trips shared by other users;
- editing a trip when its paying owner has enabled collaboration;
- one introductory AI experience with a strict generation limit;
- banner advertising in carefully selected areas, if advertising is enabled.

The introductory AI experience should be sufficiently complete to demonstrate conversational planning. A possible starting allowance is one initial draft plus two refinements. This is a product hypothesis and must be costed before launch.

The free allowance should be granted once per authenticated account, not refreshed monthly. Server-side rate limits and abuse monitoring are still required.

### Lifetime Plus

Lifetime Plus is a non-consumable in-app purchase. Its benefits should be permanent and should not create substantial unbounded variable cost.

Proposed benefits:

- remove advertising;
- allow the owner to enable co-editing on their trips;
- include future premium organisation or presentation features with low marginal cost;
- optionally include one fixed, one-time AI Trip Pass as a welcome bonus.

Only the trip owner should need Lifetime Plus to enable co-editing. Invited companions should be able to participate without buying Plus themselves. Requiring every collaborator to pay would weaken invitation-driven acquisition.

The server operation that creates or enables collaborative membership must verify the owner's entitlement. Hiding the invite control in the client is not sufficient enforcement.

### AI Trip Passes and generation packs

AI usage should be sold as a consumable in-app purchase.

Two understandable packaging options are:

#### Trip Pass

A Trip Pass includes:

- one initial researched draft;
- a fixed maximum number of conversational revisions;
- recovery of that planning session while it remains available.

For example, one pass might contain one initial draft and up to four revisions. The exact allowance must be set only after measuring real costs.

#### Generation pack

A generation pack grants a visible balance. Each accepted initial draft or refinement consumes a defined number of generations.

The product should use terms such as `AI Trip Pass`, `AI draft`, or `AI generation`. It should not expose OpenAI token terminology to users.

Trip Passes are likely easier for occasional travellers to understand. A generation balance is more flexible for frequent users. Wafflelog can begin with one format rather than launching both simultaneously.

## Advertising

Advertising should be considered supplementary income rather than the mechanism that funds AI usage.

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

## AI Charging Rules

The planning API must be the enforcement point because the Expo client, local SQLite database, and UI state can be modified by a user.

Recommended lifecycle:

1. The authenticated app submits a planning or refinement request with an idempotency key.
2. The API validates authentication, request shape, limits, and entitlement.
3. The API atomically reserves the required credit.
4. The API creates the planning job using the same logical idempotency key.
5. Repeating the same logical request returns the existing charge and job rather than deducting again.
6. A successful or meaningfully started job consumes the reservation.
7. A qualifying internal failure refunds it exactly once.

Recommended initial charging policy:

- no charge for local validation errors;
- no charge for API authentication or request-validation failures;
- no duplicate charge for an idempotent retry;
- automatic refund when Wafflelog's service fails before producing a usable revision;
- no automatic refund for a user cancellation after material AI work has started;
- document the cancellation rule clearly before purchase;
- customer-support adjustments use audited ledger entries rather than directly overwriting a balance.

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
- whether a credit was reserved, consumed, or refunded.

Measure initial generations and refinements separately. They may have very different cost profiles.

Useful metrics include:

- median and 95th-percentile initial-generation cost;
- median and 95th-percentile refinement cost;
- average revisions per completed planning session;
- failure and refund rate;
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
- failed work that must be refunded;
- customer support and purchase disputes;
- monitoring and observability;
- model-price changes;
- low initial sales volume sharing the fixed hosting cost.

### Break-even tracking

Track contribution separately for each product:

```text
AI pack contribution
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

- Lifetime Plus: approximately £14.99–£24.99 as an early one-off purchase.
- Introductory AI trial: one initial plan plus a small fixed number of refinements.
- Trip Pass: priced from measured maximum expected cost rather than competitor pricing alone.
- Larger generation packs: a modest per-generation discount without falling below the required contribution margin.

Current travel-app subscriptions provide useful willingness-to-pay context but should not determine Wafflelog's structure. Wanderlog advertises Pro from $39.99 per year, TripIt Pro is $49 per year, and Layla lists monthly and annual AI subscriptions. Wafflelog's one-off-plus-consumables model is intentionally different because it matches episodic travel planning and variable AI costs.

## Technical Architecture

### Store products

Configure at least two product classes:

- `wafflelog_plus_lifetime`: non-consumable;
- one or more AI Trip Pass or generation-pack products: consumable.

Use the same logical product catalogue across Apple and Google while retaining their platform-specific product identifiers.

### Purchase provider

RevenueCat is the recommended first integration because it can unify StoreKit and Google Play Billing, validate purchases, expose entitlements, and publish webhooks.

Use the authenticated Supabase user UUID as the stable RevenueCat app user ID. Define and test account-switching, sign-out, anonymous-user, merge, and restore-purchase behaviour before release.

Real in-app purchase testing requires an Expo development build. Expo Go can be used for UI previewing but not for completing real store transactions.

### Entitlement storage

Lifetime Plus can be represented by RevenueCat's active entitlement and optionally mirrored into a server-owned entitlement table for fast backend decisions.

Do not use user-editable Supabase `user_metadata` for authorisation. If an entitlement is mirrored into Supabase, it should be written only by a trusted webhook or backend and checked directly during the protected operation.

The co-edit invitation or enablement endpoint must check the trip owner's entitlement. Existing collaborator permissions can continue to determine whether an invited user may edit after access has legitimately been granted.

### Credit ledger

Use either RevenueCat virtual currency or an append-only server-side ledger. A Wafflelog-owned ledger provides maximum control over reservation and refund behaviour.

Suggested logical records:

- current balance or a derived balance;
- purchase grant;
- trial grant;
- job reservation;
- consumption;
- failure refund;
- support adjustment;
- provider transaction or webhook identifier;
- planning job and idempotency identifiers;
- timestamps and reason codes.

The client should have read-only access to its balance. Credit grants, deductions, and refunds must be performed by a trusted backend operation. Any Supabase table exposed through the Data API must use RLS with ownership checks; alternatively, keep the ledger in a non-exposed schema and provide a narrow authenticated API.

Use unique constraints for provider transaction IDs and logical idempotency keys so duplicate webhooks, retries, or concurrent taps cannot grant or deduct twice.

### Planning API changes

The planning service will eventually need to:

- read the authenticated user's AI entitlement or balance;
- reserve and consume credit atomically;
- associate the credit transaction with the planning job;
- reuse the charge when an idempotency key is repeated;
- refund qualifying internal failures;
- expose a safe balance/status endpoint;
- return stable error codes for insufficient balance and purchase-required states.

Potential error codes:

```text
AI_CREDIT_REQUIRED
AI_CREDIT_BALANCE_LOW
AI_CREDIT_RESERVATION_FAILED
AI_CREDIT_ALREADY_CONSUMED
```

Do not place RevenueCat secret keys, Supabase service-role credentials, OpenAI keys, or ledger mutation capability in the Expo application.

## Cost Controls

Even with paid credits, protect the service from unexpectedly expensive jobs:

- retain strict destination, duration, and prompt-length limits;
- set model input and output limits;
- cap included revisions per Trip Pass;
- rate-limit planning jobs per user and account;
- prevent concurrent active jobs where the product does not support them;
- use structured output and deterministic validation to reduce retries;
- consider a lower-cost model for suitable refinement or validation work;
- test cheaper models against a fixed quality evaluation set before switching;
- monitor cost by model version and deploy a server-side kill switch;
- never advertise unlimited AI while the cost remains usage-based.

## Implementation Phases

### Phase 0: cost discovery and product decisions

- Add privacy-safe per-job cost measurement.
- Run representative initial and refinement prompts across supported trip lengths.
- Calculate median, 95th-percentile, and maximum observed costs.
- Decide whether the customer buys Trip Passes or general generation packs.
- Define the exact free trial and cancellation/refund policy.
- Select initial Lifetime Plus and AI pack price hypotheses.

No paywall should be finalised before this phase provides usable cost data.

### Phase 1: purchase foundation

- Configure Apple and Google merchant agreements and tax information.
- Enrol in applicable small-developer fee programmes.
- Create RevenueCat projects, apps, products, offerings, and entitlements.
- Add the RevenueCat Expo SDK and development-build configuration.
- Use the Supabase user UUID as the RevenueCat identity.
- Build purchase, restore, pending, cancellation, and error states.
- Add a server webhook endpoint with signature/authenticity validation and replay protection.

### Phase 2: Lifetime Plus and collaboration

- Add a Plus entitlement query and cache.
- Gate ad removal and owner-enabled co-editing.
- Enforce the co-edit entitlement in the trusted server/database operation.
- Decide how existing collaborative trips are grandfathered.
- Add a purchase screen that clearly distinguishes permanent Plus features from consumable AI usage.
- Test restore purchases and account switching on iOS and Android.

### Phase 3: credit ledger and AI enforcement

- Create the append-only ledger or configure RevenueCat virtual currency.
- Process consumable purchase grants idempotently.
- Add trial grants.
- Add atomic reservation, consumption, and refund operations.
- Integrate the planning-session and refinement endpoints.
- Expose balance and transaction status safely to the app.
- Add insufficient-balance UI and the AI purchase screen.
- Verify that direct API calls cannot bypass charging.

### Phase 4: advertising

- Select an Expo-compatible advertising SDK and configure native builds.
- Add the UK/EEA consent-management flow and privacy-settings entry point.
- Implement one approved banner placement.
- Suppress advertising immediately when Plus is active.
- Verify layout, accessibility, offline behaviour, and failed-ad loading.
- Measure whether advertising revenue justifies its product and compliance cost before expanding placements.

### Phase 5: controlled rollout

- Launch to internal and store sandbox testers.
- Verify real purchase, pending, cancellation, refund, restore, and webhook flows.
- Release to a small percentage or test audience.
- Monitor costs, conversion, failed purchases, credit discrepancies, and support requests.
- Adjust allowances and prices remotely where store tooling permits.
- Expand only after ledger reconciliation and unit economics remain reliable.

## Testing Requirements

### Purchases and entitlements

- successful Lifetime Plus purchase;
- successful consumable purchase;
- user cancellation and pending purchase;
- duplicate store webhook;
- delayed or out-of-order webhook;
- store refund or revocation;
- restore Lifetime Plus after reinstall;
- account switching on one device;
- the same Supabase account on another device;
- purchase made while the app loses connectivity;
- price and product unavailable in a region.

### Credits

- one trial grant per eligible account;
- concurrent planning requests cannot overspend;
- an idempotent API retry charges once;
- insufficient balance rejects before AI work begins;
- an internal failure refunds once;
- a completed job cannot be refunded twice;
- a user cancellation follows the documented policy;
- support adjustments remain auditable;
- the client cannot directly increase its balance;
- deleting or reinstalling the app does not recreate trial credit.

### Collaboration

- a free owner cannot bypass the Plus gate;
- a Plus owner can enable co-editing;
- invited free users can edit the permitted trip;
- collaborators cannot enable access for unrelated trips;
- entitlement revocation or refund follows the documented lifetime-product policy;
- RLS and server checks prevent direct API bypass.

### Advertising and privacy

- ads are absent for Plus users;
- ads never appear in excluded high-focus screens;
- UK/EEA consent is collected before eligible personalised advertising;
- refusing or changing consent is respected;
- the privacy-settings control remains accessible;
- ad loading failure does not move or block core content;
- accessibility and small-screen layouts remain usable.

## Metrics

Track the following without prompt or itinerary contents:

- active free and Plus users;
- free-to-Plus conversion;
- introductory AI trial start and completion;
- trial-to-paid-AI conversion;
- Trip Pass and pack purchase rate;
- average generations consumed per purchaser;
- cost per initial plan, refinement, completed session, and imported trip;
- gross and contribution revenue by product;
- credit reservation and refund rate;
- planning failure and abandonment rate;
- collaboration invitations and accepted invitations;
- ad impressions, revenue, opt-out rate, and effect on retention;
- purchase failures, restores, disputes, and support contacts.

The primary early business metric should be contribution after AI cost, not gross purchase revenue.

## Risks and Mitigations

### Lifetime purchase creates unexpected ongoing cost

Mitigation: keep recurring AI usage outside Lifetime Plus, constrain storage-heavy future benefits, and define the permanent entitlement precisely.

### AI packs feel confusing or punitive

Mitigation: sell complete Trip Passes, display the included revisions clearly, show the remaining allowance, and never deduct for validation failures or duplicate retries.

### Ads weaken the product experience

Mitigation: begin with one restrained placement, exclude planning and trip-critical screens, and remove ads permanently with Plus.

### Collaboration paywall slows growth

Mitigation: require payment from the trip owner only and let invited companions participate free.

### Client or API abuse creates uncharged AI work

Mitigation: perform credit reservation in the planning backend, use authenticated user IDs, enforce rate limits, and make every mutation idempotent.

### Model or provider pricing changes

Mitigation: retain hard limits, model-routing controls, cost monitoring, a server kill switch, and remotely configurable product allowances where possible.

## Decisions Required Before Implementation

1. Should the paid AI unit be a complete Trip Pass or a general generation balance?
2. How many initial drafts and refinements should the free trial include?
3. Should Lifetime Plus include a one-time AI bonus?
4. What is the initial Lifetime Plus price hypothesis?
5. Does Free allow one collaborative trip, or is owner-enabled co-editing entirely a Plus feature?
6. How should existing collaborative trips and early users be grandfathered?
7. Which failures qualify for an automatic credit refund?
8. Should user-requested cancellation after research begins consume the generation?
9. Will credits remain indefinitely, and how will refunds or chargebacks affect already consumed balances?
10. Should advertising launch with purchases or wait until there is enough active usage to measure it meaningfully?
11. Will web purchases be supported initially or only native iOS and Android purchases?
12. Should RevenueCat or Wafflelog's backend be the source of truth for AI balances?

## Recommended Starting Decisions

Unless cost data suggests otherwise:

1. Launch with Trip Passes rather than abstract credits.
2. Give each authenticated user one bounded starter trip once.
3. Make Lifetime Plus a permanent ad-free and owner-collaboration entitlement.
4. Include at most one fixed AI welcome bonus with Plus; do not renew it monthly.
5. Let invited companions edit a Plus owner's trip for free.
6. Keep ads out of the AI and active trip-planning experience.
7. Use RevenueCat for purchase validation and entitlements.
8. Keep AI charging authoritative in a trusted backend ledger or RevenueCat virtual currency.
9. Implement cost measurement before deciding pack sizes and prices.

## Reference Material

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple in-app purchase product types](https://developer.apple.com/documentation/storekit/original-api-for-in-app-purchase)
- [Apple App Store Small Business Program](https://developer.apple.com/app-store/small-business-program/)
- [Google Play one-time product types](https://support.google.com/googleplay/android-developer/answer/14590082?hl=en-EN)
- [Google Play service fees](https://support.google.com/googleplay/android-developer/answer/112622?hl=en)
- [RevenueCat Expo integration](https://www.revenuecat.com/docs/getting-started/installation/expo)
- [RevenueCat virtual-currency source of truth](https://www.revenuecat.com/docs/offerings/virtual-currency/faq/balance-source-of-truth)
- [Google AdMob consent management](https://support.google.com/admob/answer/7666519?hl=en)
- [Wanderlog Pro](https://wanderlog.com/pro)
- [TripIt Pro pricing](https://www.tripit.com/web/pro/pricing)
- [Layla App Store listing](https://apps.apple.com/us/app/layla-ai-trip-planner/id6758730467)
