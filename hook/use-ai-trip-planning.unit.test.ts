import type {
  PlanningApiResponse,
  PlanningJob,
} from "@/lib/ai-trip-planning/types";
import { describe, expect, it } from "vitest";
import {
  aiTripPlanningQueryKeys,
  buildLocalPlanningJobUpdate,
  getPlanningJobPollInterval,
  isTerminalPlanningJob,
} from "./use-ai-trip-planning";

function runningJob(
  status: "queued" | "researching" | "drafting" | "validating" = "queued",
): PlanningJob {
  return {
    id: "job-1",
    sessionId: "session-1",
    status,
    progress: {
      stage: "research",
      message: "Researching the destination",
    },
    updatedAt: "2026-08-10T12:00:00.000Z",
  };
}

function response(
  data: PlanningJob,
  retryAfterMs: number | null,
): PlanningApiResponse<PlanningJob> {
  return { data, retryAfterMs };
}

function terminalJob(
  status: "completed" | "failed" | "cancelled",
): PlanningJob {
  const common = {
    id: "job-1",
    sessionId: "session-1",
    updatedAt: "2026-08-10T12:00:00.000Z",
  };

  if (status === "failed") {
    return { ...common, status, message: "Planning failed" };
  }

  if (status === "cancelled") {
    return { ...common, status };
  }

  return {
    ...common,
    status,
    revisionNumber: 1,
    result: {
      schemaVersion: 1,
      title: "Kyoto",
      destination: {
        name: "Kyoto",
        country: "Japan",
        timezone: "Asia/Tokyo",
      },
      durationDays: 3,
      summary: "A relaxed trip",
      assumptions: [],
      days: [],
      checklistSuggestions: [],
      referenceLinks: [],
      warnings: [],
    },
  };
}

describe("AI trip planning query keys", () => {
  it("creates stable hierarchical session and job keys", () => {
    expect(aiTripPlanningQueryKeys.session("session-1")).toEqual([
      "ai-trip-planning",
      "sessions",
      "session-1",
    ]);
    expect(aiTripPlanningQueryKeys.job("job-1")).toEqual([
      "ai-trip-planning",
      "jobs",
      "job-1",
    ]);
    expect(
      aiTripPlanningQueryKeys.localSession("session-1", "user-a"),
    ).toEqual([
      "ai-trip-planning",
      "local-sessions",
      "user-a",
      "session-1",
    ]);
  });

  it("maps public running progress into the local recovery record", () => {
    expect(
      buildLocalPlanningJobUpdate(runningJob("researching"), "user-a"),
    ).toEqual({
      id: "session-1",
      userId: "user-a",
      activeJobId: "job-1",
      status: "researching",
      progressStage: "research",
      progressMessage: "Researching the destination",
    });
  });

  it("clears public progress for a terminal job", () => {
    expect(
      buildLocalPlanningJobUpdate(terminalJob("completed"), "user-a"),
    ).toMatchObject({
      status: "completed",
      progressStage: null,
      progressMessage: null,
    });
  });
});

describe("AI trip planning polling", () => {
  it("uses the default interval before the first response", () => {
    expect(getPlanningJobPollInterval(undefined)).toBe(3000);
  });

  it("uses and bounds the API retry interval", () => {
    expect(getPlanningJobPollInterval(response(runningJob(), 2500))).toBe(
      2500,
    );
    expect(getPlanningJobPollInterval(response(runningJob(), 100))).toBe(1000);
    expect(getPlanningJobPollInterval(response(runningJob(), 30_000))).toBe(
      10_000,
    );
  });

  it.each(["completed", "failed", "cancelled"] as const)(
    "stops polling when a job is %s",
    (status) => {
      const job = terminalJob(status);

      expect(isTerminalPlanningJob(job)).toBe(true);
      expect(getPlanningJobPollInterval(response(job, 3000))).toBe(false);
    },
  );

  it("continues polling for every running status", () => {
    for (const status of [
      "queued",
      "researching",
      "drafting",
      "validating",
    ] as const) {
      expect(isTerminalPlanningJob(runningJob(status))).toBe(false);
    }
  });
});
