import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createPlanningApiClient,
  type PlanningFetch,
} from "./client";
import { PlanningApiError } from "./errors";

const BASE_URL = "https://planning.example.com";
const ACCESS_TOKEN = "access-token";

function jsonResponse(
  body: unknown,
  init: ResponseInit = {},
) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function createClient(fetchImplementation: PlanningFetch) {
  return createPlanningApiClient({
    baseUrl: `${BASE_URL}/`,
    fetchImplementation,
    getAccessToken: async () => ACCESS_TOKEN,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("planning API client", () => {
  it("creates a planning session with authentication and idempotency", async () => {
    const accepted = {
      id: "session-1",
      createdAt: "2026-08-10T12:00:00.000Z",
      job: {
        id: "job-1",
        sessionId: "session-1",
        status: "queued" as const,
        createdAt: "2026-08-10T12:00:00.000Z",
        statusUrl: "/v1/planning-jobs/job-1",
        eventsUrl: null,
      },
    };
    const fetchMock = vi.fn<PlanningFetch>().mockResolvedValue(
      jsonResponse(accepted, {
        status: 202,
        headers: { "Retry-After": "3" },
      }),
    );
    const client = createClient(fetchMock);
    const request = {
      destination: "Kyoto, Japan",
      durationDays: 3,
      tripBrief: "Food, temples, and relaxed mornings.",
      locale: "en-GB",
    };

    await expect(
      client.createPlanningSession(request, "request-1"),
    ).resolves.toEqual({ data: accepted, retryAfterMs: 3000 });
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/v1/planning-sessions`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "Idempotency-Key": "request-1",
        },
        body: JSON.stringify(request),
        signal: expect.any(AbortSignal),
      },
    );
  });

  it("submits a refinement to an encoded session path", async () => {
    const accepted = {
      sessionId: "session/1",
      messageId: "message-1",
      job: {
        id: "job-2",
        sessionId: "session/1",
        status: "queued" as const,
        createdAt: "2026-08-10T12:05:00.000Z",
        statusUrl: "/v1/planning-jobs/job-2",
        eventsUrl: null,
      },
    };
    const fetchMock = vi
      .fn<PlanningFetch>()
      .mockResolvedValue(jsonResponse(accepted, { status: 202 }));
    const client = createClient(fetchMock);

    await expect(
      client.createPlanningRefinement(
        "session/1",
        { content: "Make day two more relaxed." },
        "request-2",
      ),
    ).resolves.toEqual({ data: accepted, retryAfterMs: null });
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/v1/planning-sessions/session%2F1/messages`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Idempotency-Key": "request-2",
        }),
      }),
    );
  });

  it("reads sessions and jobs and cancels a job", async () => {
    const fetchMock = vi
      .fn<PlanningFetch>()
      .mockImplementation(async () => jsonResponse({ id: "response" }));
    const client = createClient(fetchMock);

    await client.getPlanningSession("session-1");
    await client.getPlanningJob("job-1");
    await client.cancelPlanningJob("job-1");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `${BASE_URL}/v1/planning-sessions/session-1`,
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${BASE_URL}/v1/planning-jobs/job-1`,
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      `${BASE_URL}/v1/planning-jobs/job-1`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("rejects unauthenticated requests without calling fetch", async () => {
    const fetchMock = vi.fn<PlanningFetch>();
    const client = createPlanningApiClient({
      baseUrl: BASE_URL,
      fetchImplementation: fetchMock,
      getAccessToken: async () => null,
    });

    await expect(client.getPlanningJob("job-1")).rejects.toMatchObject({
      kind: "authentication",
      status: null,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("normalizes documented API errors", async () => {
    const fetchMock = vi
      .fn<PlanningFetch>()
      .mockResolvedValue(
        jsonResponse(
          { detail: "Idempotency key conflicts with an earlier request." },
          { status: 409 },
        ),
      );
    const client = createClient(fetchMock);

    await expect(
      client.createPlanningSession(
        {
          destination: "Kyoto",
          durationDays: 3,
          tripBrief: "A relaxed trip.",
        },
        "request-1",
      ),
    ).rejects.toMatchObject({
      kind: "api",
      status: 409,
      detail: "Idempotency key conflicts with an earlier request.",
    });
  });

  it("normalizes network failures", async () => {
    const cause = new TypeError("fetch failed");
    const fetchMock = vi.fn<PlanningFetch>().mockRejectedValue(cause);
    const client = createClient(fetchMock);

    try {
      await client.getPlanningJob("job-1");
      throw new Error("Expected the request to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(PlanningApiError);
      expect(error).toMatchObject({ kind: "network", cause });
    }
  });

  it("aborts requests that exceed the configured timeout", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn<PlanningFetch>().mockImplementation(
      async (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new Error("request aborted")),
            { once: true },
          );
        }),
    );
    const client = createPlanningApiClient({
      baseUrl: BASE_URL,
      fetchImplementation: fetchMock,
      getAccessToken: async () => ACCESS_TOKEN,
      requestTimeoutMs: 100,
    });
    const request = client.getPlanningJob("job-1");
    const expectation = expect(request).rejects.toMatchObject({
      kind: "timeout",
      status: null,
      message: "Planning service request timed out",
    });

    await vi.advanceTimersByTimeAsync(100);
    await expectation;
  });

  it("rejects invalid successful responses", async () => {
    const fetchMock = vi
      .fn<PlanningFetch>()
      .mockResolvedValue(
        new Response("not-json", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    const client = createClient(fetchMock);

    await expect(client.getPlanningJob("job-1")).rejects.toMatchObject({
      kind: "invalid-response",
      status: 200,
    });
  });
});
