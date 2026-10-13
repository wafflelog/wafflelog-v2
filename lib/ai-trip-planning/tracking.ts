import {
  isPlanningApiError,
  type PlanningApiErrorKind,
} from "@/lib/ai-trip-planning/errors";
import type {
  TripAssistantFailureReason,
  TripDurationBucket,
} from "@/lib/tracking";

const FAILURE_REASON_BY_ERROR_KIND: Record<
  Exclude<PlanningApiErrorKind, "api">,
  TripAssistantFailureReason
> = {
  authentication: "authentication",
  configuration: "unknown",
  "invalid-response": "server",
  network: "network",
  timeout: "timeout",
};

const DURATION_BUCKETS = [
  { maximum: 3, value: "1_3_days" },
  { maximum: 7, value: "4_7_days" },
  { maximum: 14, value: "8_14_days" },
] as const;

function getApiFailureReason(
  status: number | null,
): TripAssistantFailureReason {
  if (status === 401 || status === 403) {
    return "authentication";
  }

  if (status !== null && status >= 400 && status < 500) {
    return "validation";
  }

  return "server";
}

export function getPlanningFailureReason(
  error: unknown,
): TripAssistantFailureReason {
  if (!isPlanningApiError(error)) {
    return "unknown";
  }

  return error.kind === "api"
    ? getApiFailureReason(error.status)
    : FAILURE_REASON_BY_ERROR_KIND[error.kind];
}

export function getTripDurationBucket(
  durationDays: number,
): TripDurationBucket {
  const normalizedDuration = Math.max(1, Math.floor(durationDays));

  return (
    DURATION_BUCKETS.find(
      ({ maximum }) => normalizedDuration <= maximum,
    )?.value ?? "15_plus"
  );
}
