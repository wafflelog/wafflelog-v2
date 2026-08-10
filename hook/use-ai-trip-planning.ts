import {
  createPlanningRequestId,
  planningApiClient,
} from "@/lib/ai-trip-planning/client";
import type {
  CreatePlanningRefinementRequest,
  CreatePlanningSessionRequest,
  PlanningApiResponse,
  PlanningJob,
} from "@/lib/ai-trip-planning/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const DEFAULT_POLL_INTERVAL_MS = 3000;
const MIN_POLL_INTERVAL_MS = 1000;
const MAX_POLL_INTERVAL_MS = 10_000;

export const aiTripPlanningQueryKeys = {
  all: ["ai-trip-planning"] as const,
  sessions: () => [...aiTripPlanningQueryKeys.all, "sessions"] as const,
  session: (sessionId: string) =>
    [...aiTripPlanningQueryKeys.sessions(), sessionId] as const,
  jobs: () => [...aiTripPlanningQueryKeys.all, "jobs"] as const,
  job: (jobId: string) =>
    [...aiTripPlanningQueryKeys.jobs(), jobId] as const,
};

export type CreatePlanningSessionVariables = {
  request: CreatePlanningSessionRequest;
  idempotencyKey: string;
};

export type CreatePlanningRefinementVariables = {
  sessionId: string;
  request: CreatePlanningRefinementRequest;
  idempotencyKey: string;
};

export function buildPlanningMutationId() {
  return createPlanningRequestId();
}

export function isTerminalPlanningJob(job: PlanningJob) {
  return (
    job.status === "completed" ||
    job.status === "failed" ||
    job.status === "cancelled"
  );
}

export function getPlanningJobPollInterval(
  response: PlanningApiResponse<PlanningJob> | undefined,
) {
  if (response && isTerminalPlanningJob(response.data)) {
    return false;
  }

  const requestedInterval =
    response?.retryAfterMs ?? DEFAULT_POLL_INTERVAL_MS;

  return Math.min(
    MAX_POLL_INTERVAL_MS,
    Math.max(MIN_POLL_INTERVAL_MS, requestedInterval),
  );
}

export function useCreatePlanningSession() {
  return useMutation({
    mutationFn: async ({
      request,
      idempotencyKey,
    }: CreatePlanningSessionVariables) => {
      const response = await planningApiClient.createPlanningSession(
        request,
        idempotencyKey,
      );

      return response.data;
    },
  });
}

export function useCreatePlanningRefinement() {
  return useMutation({
    mutationFn: async ({
      sessionId,
      request,
      idempotencyKey,
    }: CreatePlanningRefinementVariables) => {
      const response = await planningApiClient.createPlanningRefinement(
        sessionId,
        request,
        idempotencyKey,
      );

      return response.data;
    },
  });
}

export function usePlanningSession(
  sessionId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: aiTripPlanningQueryKeys.session(sessionId ?? ""),
    queryFn: () => planningApiClient.getPlanningSession(sessionId!),
    enabled: Boolean(sessionId) && enabled,
    select: (response) => response.data,
  });
}

export function usePlanningJob(
  jobId: string | null | undefined,
  enabled = true,
) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: aiTripPlanningQueryKeys.job(jobId ?? ""),
    queryFn: () => planningApiClient.getPlanningJob(jobId!),
    enabled: Boolean(jobId) && enabled,
    select: (response) => response.data,
    refetchInterval: (jobQuery) =>
      getPlanningJobPollInterval(jobQuery.state.data),
  });

  const sessionId = query.data?.sessionId;
  const status = query.data?.status;

  useEffect(() => {
    if (
      !sessionId ||
      (status !== "completed" &&
        status !== "failed" &&
        status !== "cancelled")
    ) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: aiTripPlanningQueryKeys.session(sessionId),
    });
  }, [queryClient, sessionId, status]);

  return query;
}

export function useCancelPlanningJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await planningApiClient.cancelPlanningJob(jobId);

      return response.data;
    },
    onSuccess: (job) => {
      queryClient.setQueryData(aiTripPlanningQueryKeys.job(job.id), {
        data: job,
        retryAfterMs: null,
      } satisfies PlanningApiResponse<PlanningJob>);

      void queryClient.invalidateQueries({
        queryKey: aiTripPlanningQueryKeys.session(job.sessionId),
      });
    },
  });
}

