import { buildUUID } from "@/lib/sqlite/utils";
import { PlanningApiError, isPlanningApiError } from "./errors";
import type {
  CreatePlanningRefinementRequest,
  CreatePlanningSessionRequest,
  PlanningApiResponse,
  PlanningJob,
  PlanningRefinementAccepted,
  PlanningSession,
  PlanningSessionAccepted,
} from "./types";

const DEFAULT_BASE_URL = "https://api.wafflelog.co.uk";
export const DEFAULT_PLANNING_REQUEST_TIMEOUT_MS = 15_000;

type GetAccessToken = () => Promise<string | null>;

export type PlanningFetch = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

type PlanningApiClientOptions = {
  baseUrl?: string;
  fetchImplementation?: PlanningFetch;
  getAccessToken?: GetAccessToken;
  requestTimeoutMs?: number;
};

type RequestOptions = {
  method?: "DELETE" | "GET" | "POST";
  body?: unknown;
  idempotencyKey?: string;
};

export type PlanningApiClient = {
  createPlanningSession: (
    request: CreatePlanningSessionRequest,
    idempotencyKey: string,
  ) => Promise<PlanningApiResponse<PlanningSessionAccepted>>;
  createPlanningRefinement: (
    sessionId: string,
    request: CreatePlanningRefinementRequest,
    idempotencyKey: string,
  ) => Promise<PlanningApiResponse<PlanningRefinementAccepted>>;
  getPlanningSession: (
    sessionId: string,
  ) => Promise<PlanningApiResponse<PlanningSession>>;
  getPlanningJob: (jobId: string) => Promise<PlanningApiResponse<PlanningJob>>;
  cancelPlanningJob: (
    jobId: string,
  ) => Promise<PlanningApiResponse<PlanningJob>>;
};

async function getSupabaseAccessToken() {
  const { supabase } = await import("@/lib/supabase/client");
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new PlanningApiError("Unable to read the current session", {
      kind: "authentication",
      detail: error.message,
      cause: error,
    });
  }

  return data.session?.access_token ?? null;
}

function normalizeBaseUrl(baseUrl: string) {
  const normalized = baseUrl.trim().replace(/\/+$/, "");

  if (!normalized) {
    throw new PlanningApiError("AI trip planning API URL is not configured", {
      kind: "configuration",
    });
  }

  return normalized;
}

function parseRetryAfterMs(response: Response) {
  const value = response.headers.get("Retry-After");

  if (!value) {
    return null;
  }

  const seconds = Number(value);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const retryAt = Date.parse(value);

  if (Number.isNaN(retryAt)) {
    return null;
  }

  return Math.max(0, retryAt - Date.now());
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new PlanningApiError("Planning service returned invalid JSON", {
      kind: "invalid-response",
      status: response.status,
      cause: error,
    });
  }
}

function readErrorDetail(body: unknown) {
  if (
    typeof body === "object" &&
    body !== null &&
    "detail" in body &&
    typeof body.detail === "string"
  ) {
    return body.detail;
  }

  if (
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }

  return null;
}

export function createPlanningRequestId() {
  return buildUUID();
}

export function createPlanningApiClient(
  options: PlanningApiClientOptions = {},
): PlanningApiClient {
  const baseUrl = normalizeBaseUrl(
    options.baseUrl ??
      process.env.EXPO_PUBLIC_AI_TRIP_PLANNING_API_URL ??
      DEFAULT_BASE_URL,
  );
  const fetchImplementation = options.fetchImplementation ?? fetch;
  const getAccessToken = options.getAccessToken ?? getSupabaseAccessToken;
  const requestTimeoutMs =
    options.requestTimeoutMs ?? DEFAULT_PLANNING_REQUEST_TIMEOUT_MS;

  async function request<T>(
    path: string,
    requestOptions: RequestOptions = {},
  ): Promise<PlanningApiResponse<T>> {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      throw new PlanningApiError(
        "You must be signed in to use AI trip planning",
        { kind: "authentication" },
      );
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    if (requestOptions.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (requestOptions.idempotencyKey) {
      headers["Idempotency-Key"] = requestOptions.idempotencyKey;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    let response: Response;
    let responseBody: unknown;

    try {
      response = await fetchImplementation(`${baseUrl}${path}`, {
        method: requestOptions.method ?? "GET",
        headers,
        body:
          requestOptions.body === undefined
            ? undefined
            : JSON.stringify(requestOptions.body),
        signal: controller.signal,
      });
      responseBody = await parseJsonResponse(response);
    } catch (error) {
      if (isPlanningApiError(error)) {
        throw error;
      }

      if (controller.signal.aborted) {
        throw new PlanningApiError("Planning service request timed out", {
          kind: "timeout",
          cause: error,
        });
      }

      throw new PlanningApiError("Unable to reach the planning service", {
        kind: "network",
        cause: error,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const detail = readErrorDetail(responseBody);

      throw new PlanningApiError(
        detail ?? `Planning service request failed (${response.status})`,
        {
          kind: response.status === 401 ? "authentication" : "api",
          status: response.status,
          detail: detail ?? undefined,
        },
      );
    }

    if (responseBody === null) {
      throw new PlanningApiError(
        "Planning service returned an empty response",
        {
          kind: "invalid-response",
          status: response.status,
        },
      );
    }

    return {
      data: responseBody as T,
      retryAfterMs: parseRetryAfterMs(response),
    };
  }

  return {
    createPlanningSession: (planningRequest, idempotencyKey) =>
      request<PlanningSessionAccepted>("/v1/planning-sessions", {
        method: "POST",
        body: planningRequest,
        idempotencyKey,
      }),
    createPlanningRefinement: (sessionId, refinementRequest, idempotencyKey) =>
      request<PlanningRefinementAccepted>(
        `/v1/planning-sessions/${encodeURIComponent(sessionId)}/messages`,
        {
          method: "POST",
          body: refinementRequest,
          idempotencyKey,
        },
      ),
    getPlanningSession: (sessionId) =>
      request<PlanningSession>(
        `/v1/planning-sessions/${encodeURIComponent(sessionId)}`,
      ),
    getPlanningJob: (jobId) =>
      request<PlanningJob>(`/v1/planning-jobs/${encodeURIComponent(jobId)}`),
    cancelPlanningJob: (jobId) =>
      request<PlanningJob>(`/v1/planning-jobs/${encodeURIComponent(jobId)}`, {
        method: "DELETE",
      }),
  };
}

export const planningApiClient = createPlanningApiClient();
