# Wafflelog AI Trip Planning API Handoff

## Purpose

Wafflelog's AI planning feature should give travellers inspiration and a usable starting point for a trip. It is not intended to produce an authoritative, fully booked itinerary.

A user might ask:

> Plan a relaxed four-day food and culture trip to Osaka for two adults. We prefer independent restaurants, limited nightlife, and no more than three scheduled activities per day.

The planning service researches the destination and returns a structured draft. Wafflelog presents that draft for review and converts the accepted suggestions into its own trip, pin, checklist item, note, and reference-link records.

The AI planning API will be developed and deployed as a separate project.

## Wafflelog Context

Wafflelog is an Expo/React Native application built around an offline-first architecture:

1. User content is written to local SQLite first.
2. Local records are subsequently synchronized to Supabase.
3. Remote content pulled from Supabase is hydrated back into SQLite.

The planning API must not write directly to Wafflelog's SQLite or Supabase databases. It returns a draft; Wafflelog owns the review, conversion, local persistence, and synchronization process.

## Recommended API Model

Implement planning as a durable asynchronous job.

```text
POST /v1/planning-jobs
        |
        | returns 202 Accepted and a job ID
        v
Background workflow researches and generates the plan
        |
        |-- GET /v1/planning-jobs/{id}        guaranteed status/result access
        `-- GET /v1/planning-jobs/{id}/events optional SSE progress
```

Polling is the source of truth. Server-sent events are a progressive enhancement for live progress.

A single streaming connection should not be the only way to obtain the result. Wafflelog is a mobile app and may be backgrounded, disconnected, or terminated while planning continues. The server-side job must survive independently and make its state and result available after reconnection.

WebSockets are unnecessary initially. The first version does not require bidirectional real-time communication during generation.

LangGraph supports persistent, checkpointed workflows and progress streaming. Its join-and-rejoin functionality can help with interrupted clients when using LangGraph Agent Server, but Wafflelog's public API contract should not depend on one deployment product:

- [LangGraph durable execution](https://docs.langchain.com/oss/python/langgraph/thinking-in-langgraph)
- [LangChain streaming](https://docs.langchain.com/oss/python/langchain/streaming)
- [Join and rejoin streams](https://docs.langchain.com/oss/python/langchain/frontend/join-rejoin)

## API Contract

### Create a planning job

```http
POST /v1/planning-jobs
Authorization: Bearer <Supabase JWT>
Idempotency-Key: <client-generated UUID>
Content-Type: application/json
```

Example request:

```json
{
  "destination": "Osaka, Japan",
  "durationDays": 4,
  "purpose": ["food", "culture"],
  "pace": "relaxed",
  "travellers": {
    "adults": 2,
    "children": 0
  },
  "preferences": [
    "independent restaurants",
    "local neighbourhoods",
    "limited nightlife"
  ],
  "constraints": [
    "maximum three scheduled activities per day"
  ],
  "freeformPrompt": "We want inspiration rather than a packed itinerary.",
  "startDate": "2026-10-12",
  "locale": "en-GB"
}
```

Response:

```http
202 Accepted
Retry-After: 3
```

```json
{
  "id": "job_uuid",
  "status": "queued",
  "createdAt": "2026-07-20T12:00:00Z",
  "statusUrl": "/v1/planning-jobs/job_uuid",
  "eventsUrl": "/v1/planning-jobs/job_uuid/events"
}
```

The idempotency key prevents duplicate plans when the mobile client retries after losing its connection.

### Read job state

```http
GET /v1/planning-jobs/{jobId}
Authorization: Bearer <Supabase JWT>
```

Possible statuses:

```text
queued
researching
drafting
validating
completed
failed
cancelled
```

Running response:

```json
{
  "id": "job_uuid",
  "status": "researching",
  "progress": {
    "stage": "destination_research",
    "message": "Researching neighbourhoods and travel times"
  },
  "updatedAt": "2026-07-20T12:00:08Z"
}
```

Completed response:

```json
{
  "id": "job_uuid",
  "status": "completed",
  "result": {
    "schemaVersion": 1,
    "plan": {}
  }
}
```

The server should return a `Retry-After` header. Wafflelog can initially poll every two to three seconds and back off to approximately five to ten seconds for longer jobs.

### Stream optional progress

```http
GET /v1/planning-jobs/{jobId}/events
Accept: text/event-stream
Authorization: Bearer <Supabase JWT>
```

Only public progress events should be streamed:

```text
research_started
source_found
draft_started
validation_started
completed
failed
```

Do not stream private chain-of-thought, raw internal prompts, or unrestricted tool output.

If Wafflelog loses the stream, it reconnects using the job ID and reads the normal status endpoint. Losing a stream must never lose the job or its result.

### Cancel a job

```http
DELETE /v1/planning-jobs/{jobId}
Authorization: Bearer <Supabase JWT>
```

Cancellation should be best-effort and idempotent.

## Planning Result Contract

The API should return a versioned semantic draft, not Wafflelog database rows.

```json
{
  "schemaVersion": 1,
  "title": "A relaxed food and culture trip to Osaka",
  "destination": {
    "name": "Osaka",
    "country": "Japan",
    "timezone": "Asia/Tokyo"
  },
  "durationDays": 4,
  "summary": "A neighbourhood-focused itinerary with time to explore.",
  "assumptions": [
    "The traveller is staying near central Osaka",
    "Opening hours should be confirmed before visiting"
  ],
  "days": [
    {
      "dayNumber": 1,
      "title": "Markets and old Osaka",
      "description": "A gentle first day around the city.",
      "items": [
        {
          "draftId": "draft_item_1",
          "type": "place",
          "title": "Kuromon Ichiba Market",
          "description": "Explore the market and try local food.",
          "suggestedStartTime": "10:00",
          "estimatedDurationMinutes": 120,
          "category": "food",
          "location": {
            "name": "Kuromon Ichiba Market",
            "searchQuery": "Kuromon Ichiba Market Osaka",
            "latitude": null,
            "longitude": null,
            "externalPlaceId": null
          },
          "reason": "Fits the requested focus on local food.",
          "sources": [
            {
              "title": "Official market website",
              "url": "https://example.com"
            }
          ]
        }
      ]
    }
  ],
  "checklistSuggestions": [
    {
      "title": "Confirm restaurant opening days"
    }
  ],
  "referenceLinks": [
    {
      "title": "Osaka visitor information",
      "url": "https://example.com"
    }
  ],
  "warnings": [
    "Opening hours and availability may change"
  ]
}
```

Contract rules:

- `schemaVersion` is required.
- `dayNumber` keeps the API independent from Wafflelog's exact date representation.
- Suggested times may be absent.
- Every researched recommendation should retain its source links.
- A location may contain only a search query when coordinates or an external place ID cannot be verified.
- The response must pass deterministic JSON-schema validation.
- Unknown facts should be omitted or marked uncertain rather than invented.
- The plan must remain a suggestion that the user can review and change.

## Wafflelog Import Behaviour

Wafflelog should present the completed draft on a review screen before creating local records.

The user should be able to:

- change the trip title and dates;
- exclude entire days;
- exclude individual suggestions;
- review assumptions, warnings, and sources;
- confirm the final import.

After confirmation, the app maps the draft into local objects:

| Planning draft | Wafflelog object |
| --- | --- |
| Title, dates, and duration | Trip |
| Day item | Pin |
| Resolved or searchable location | Pin location |
| Day or item context | Note |
| Checklist suggestion | Checklist item |
| Cited resource | Reference link |

Wafflelog generates its own UUIDs and performs normal offline-first local writes. Existing synchronization sends those records to Supabase later.

The initial version should not generate expenses, images, or documents.

## Proposed Agent Workflow

Use LangChain for model and tool abstractions and LangGraph for the durable workflow.

```text
Validate request
      |
      v
Build a bounded research plan
      |
      v
Research destination, places, and logistics
      |
      v
Normalize, deduplicate, and rank findings
      |
      v
Construct the day-by-day itinerary
      |
      v
Generate checklist suggestions and references
      |
      v
Validate structured output
      |
      v
Repair once if invalid
      |
      v
Persist the completed result
```

Research tasks such as places, logistics, and destination constraints may run in parallel, but each task needs explicit limits.

An unrestricted deep-agent design may be unnecessary for the first version. Begin with a bounded graph whose nodes, inputs, outputs, and failures are observable. Deep Agents can later provide subagent progress and parallel research, but async-subagent functionality is currently documented as preview, so the public API must not depend on it:

- [Deep Agents streaming](https://docs.langchain.com/oss/python/deepagents/streaming)
- [Async subagents](https://docs.langchain.com/oss/python/deepagents/async-subagents)

## Durable State and Infrastructure

The separate API project will likely need:

- an HTTP API service;
- a persistent job database;
- a queue;
- one or more background workers;
- a durable LangGraph checkpointer;
- LLM and web-search providers;
- persisted results and source metadata;
- structured logs, traces, latency metrics, and cost metrics.

Suggested job record:

```text
id
user_id
idempotency_key
status
request_json
progress_json
result_json
error_code
error_message
workflow_thread_id
created_at
started_at
updated_at
completed_at
cancel_requested_at
```

Worker retries must be safe. Tool calls and external writes should be idempotent because graph nodes may be retried or resumed. LangGraph's interrupt documentation describes checkpointing by thread ID and highlights the need to make side effects around resumable nodes idempotent:

- [LangGraph interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts)

## Security and Reliability

- Verify the caller's Supabase JWT.
- Ensure users can access only their own jobs.
- Apply per-user concurrency, rate, and cost limits.
- Set maximum execution time, model tokens, tool calls, and researched sources.
- Treat all web content as untrusted data.
- Never execute instructions found inside researched pages.
- Keep model, search-provider, and database credentials server-side.
- Store sanitized progress messages instead of raw model reasoning.
- Preserve sources used by the final plan.
- Validate all model-produced structures before persistence.
- Support job expiry and retention policies without deleting active jobs.

Stable error codes should include:

```text
INVALID_REQUEST
RESEARCH_UNAVAILABLE
MODEL_TIMEOUT
OUTPUT_VALIDATION_FAILED
JOB_CANCELLED
RATE_LIMITED
```

## Initial Acceptance Criteria

The first API milestone is complete when:

- creating a job returns within a few seconds;
- a job continues when the client disconnects;
- the client can poll until completion;
- optional SSE provides reconnectable progress;
- duplicate idempotency keys do not start duplicate workflows;
- only the owning user can read or cancel a job;
- the final output passes the versioned schema;
- failed jobs return stable error codes;
- cancellation is supported;
- one completed draft can be imported into Wafflelog as a local trip with pins;
- sources, assumptions, and warnings survive the import.

## Decisions for the API Project

The Codex agent working in the new project should help decide:

- Python or TypeScript;
- hosting platform;
- queue and worker technology;
- Postgres and LangGraph checkpointer implementation;
- web-search provider;
- LLM provider and model routing;
- LangGraph Agent Server versus a custom API and worker deployment;
- whether SSE is part of the first milestone or added immediately afterward;
- job retention, cancellation, retry, and cost-limit policies.

A reasonable starting stack is Python, FastAPI, LangGraph, Postgres, and a conventional worker queue. The durable job API and versioned result contract should remain stable even if those infrastructure choices change.
