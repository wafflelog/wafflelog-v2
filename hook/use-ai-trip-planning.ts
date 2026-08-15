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
import type {
  LocalAiPlanningSession,
  UpdateLocalAiPlanningSessionJobInput,
} from "@/lib/sqlite/model/ai-planning-session";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

const DEFAULT_POLL_INTERVAL_MS = 3000;
const MIN_POLL_INTERVAL_MS = 1000;
const MAX_POLL_INTERVAL_MS = 10_000;
export const MAX_AUTOMATIC_PLANNING_WAIT_MS = 10 * 60 * 1000;

export const aiTripPlanningQueryKeys = {
  all: ["ai-trip-planning"] as const,
  sessions: () => [...aiTripPlanningQueryKeys.all, "sessions"] as const,
  session: (sessionId: string) =>
    [...aiTripPlanningQueryKeys.sessions(), sessionId] as const,
  jobs: () => [...aiTripPlanningQueryKeys.all, "jobs"] as const,
  job: (jobId: string) => [...aiTripPlanningQueryKeys.jobs(), jobId] as const,
  localSessions: (userId: string) =>
    [...aiTripPlanningQueryKeys.all, "local-sessions", userId] as const,
  localSession: (sessionId: string, userId: string) =>
    [...aiTripPlanningQueryKeys.localSessions(userId), sessionId] as const,
};

export type CreatePlanningSessionVariables = {
  userId: string;
  startDate: string;
  request: CreatePlanningSessionRequest;
  idempotencyKey: string;
};

export type CreatePlanningRefinementVariables = {
  userId: string;
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

  const requestedInterval = response?.retryAfterMs ?? DEFAULT_POLL_INTERVAL_MS;

  return Math.min(
    MAX_POLL_INTERVAL_MS,
    Math.max(MIN_POLL_INTERVAL_MS, requestedInterval),
  );
}

export function hasPlanningWaitTimedOut(
  startedAt: number,
  now = Date.now(),
  maxWaitMs = MAX_AUTOMATIC_PLANNING_WAIT_MS,
) {
  return now - startedAt >= maxWaitMs;
}

export function buildLocalPlanningJobUpdate(
  job: PlanningJob,
  userId: string,
): UpdateLocalAiPlanningSessionJobInput {
  return {
    id: job.sessionId,
    userId,
    activeJobId: job.id,
    status: job.status,
    progressStage: "progress" in job ? job.progress.stage : null,
    progressMessage: "progress" in job ? job.progress.message : null,
  };
}

export type RecoverableLocalAiPlanningSession = Omit<
  LocalAiPlanningSession,
  "importedTripId" | "status"
> & {
  importedTripId: null;
  status: Exclude<LocalAiPlanningSession["status"], "imported">;
};

function isRecoverableLocalAiPlanningSession(
  session: LocalAiPlanningSession,
): session is RecoverableLocalAiPlanningSession {
  return session.status !== "imported" && session.importedTripId === null;
}

export function selectLatestRecoverableAiPlanningSession(
  sessions: readonly LocalAiPlanningSession[],
) {
  return sessions.find(isRecoverableLocalAiPlanningSession) ?? null;
}

export function inferRecoveredPlanningOperation(
  activeJobId: string,
  messages: readonly { jobId: string }[],
): "initial" | "refinement" {
  return messages.some((message) => message.jobId === activeJobId)
    ? "refinement"
    : "initial";
}

export function useLocalAiPlanningSessions(
  userId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: aiTripPlanningQueryKeys.localSessions(userId ?? ""),
    queryFn: async () => {
      const { actionListLocalAiPlanningSessions } =
        await import("@/lib/sqlite/model/ai-planning-session");

      return actionListLocalAiPlanningSessions(userId!);
    },
    enabled: Boolean(userId) && enabled,
  });
}

export function useLocalAiPlanningSession(
  sessionId: string | null | undefined,
  userId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: aiTripPlanningQueryKeys.localSession(
      sessionId ?? "",
      userId ?? "",
    ),
    queryFn: async () => {
      const { actionGetLocalAiPlanningSession } =
        await import("@/lib/sqlite/model/ai-planning-session");

      return actionGetLocalAiPlanningSession(sessionId!, userId!);
    },
    enabled: Boolean(sessionId) && Boolean(userId) && enabled,
  });
}

export function useCreatePlanningSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      startDate,
      request,
      idempotencyKey,
    }: CreatePlanningSessionVariables) => {
      const response = await planningApiClient.createPlanningSession(
        request,
        idempotencyKey,
      );

      console.log("planning session response", response);

      const { actionUpsertLocalAiPlanningSession } =
        await import("@/lib/sqlite/model/ai-planning-session");
      const localSession = await actionUpsertLocalAiPlanningSession({
        id: response.data.id,
        userId,
        destination: request.destination,
        durationDays: request.durationDays,
        startDate,
        activeJobId: response.data.job.id,
        status: response.data.job.status,
      });

      return { planningSession: response.data, localSession };
    },
    onSuccess: ({ localSession }) => {
      queryClient.setQueryData(
        aiTripPlanningQueryKeys.localSession(
          localSession.id,
          localSession.userId,
        ),
        localSession,
      );
      void queryClient.invalidateQueries({
        queryKey: aiTripPlanningQueryKeys.localSessions(localSession.userId),
      });
    },
  });
}

export function useCreatePlanningRefinement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      sessionId,
      request,
      idempotencyKey,
    }: CreatePlanningRefinementVariables) => {
      const response = await planningApiClient.createPlanningRefinement(
        sessionId,
        request,
        idempotencyKey,
      );
      const { actionUpdateLocalAiPlanningSessionJob } =
        await import("@/lib/sqlite/model/ai-planning-session");
      const localSession = await actionUpdateLocalAiPlanningSessionJob({
        id: response.data.sessionId,
        userId,
        activeJobId: response.data.job.id,
        status: response.data.job.status,
      });

      return { refinement: response.data, localSession };
    },
    onSuccess: ({ localSession }) => {
      queryClient.setQueryData(
        aiTripPlanningQueryKeys.localSession(
          localSession.id,
          localSession.userId,
        ),
        localSession,
      );
      void queryClient.invalidateQueries({
        queryKey: aiTripPlanningQueryKeys.localSessions(localSession.userId),
      });
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
  userId: string | null | undefined,
  options: {
    enabled?: boolean;
    maxWaitMs?: number;
  } = {},
) {
  const queryClient = useQueryClient();
  const enabled = options.enabled ?? true;
  const maxWaitMs = options.maxWaitMs ?? MAX_AUTOMATIC_PLANNING_WAIT_MS;
  const [pollingStartedAt, setPollingStartedAt] = useState(() => Date.now());
  const [isPollingTimedOut, setIsPollingTimedOut] = useState(false);
  const query = useQuery({
    queryKey: aiTripPlanningQueryKeys.job(jobId ?? ""),
    queryFn: () => planningApiClient.getPlanningJob(jobId!),
    enabled: Boolean(jobId) && Boolean(userId) && enabled && !isPollingTimedOut,
    select: (response) => response.data,
    refetchInterval: (jobQuery) => {
      if (jobQuery.state.status === "error") {
        return false;
      }

      return getPlanningJobPollInterval(jobQuery.state.data);
    },
  });

  const sessionId = query.data?.sessionId;
  const status = query.data?.status;
  const updatedAt = query.data?.updatedAt;
  const isTerminal = query.data ? isTerminalPlanningJob(query.data) : false;

  useEffect(() => {
    setPollingStartedAt(Date.now());
    setIsPollingTimedOut(false);
  }, [jobId]);

  useEffect(() => {
    if (!jobId || !userId || !enabled || isTerminal) {
      return;
    }

    const remainingWaitMs = Math.max(
      0,
      maxWaitMs - (Date.now() - pollingStartedAt),
    );
    const timeout = setTimeout(() => {
      setIsPollingTimedOut(true);
    }, remainingWaitMs);

    return () => clearTimeout(timeout);
  }, [enabled, isTerminal, jobId, maxWaitMs, pollingStartedAt, userId]);

  const resumePolling = useCallback(() => {
    setPollingStartedAt(Date.now());
    setIsPollingTimedOut(false);
    void query.refetch();
  }, [query]);

  useEffect(() => {
    if (!query.data || !userId) {
      return;
    }

    const job = query.data;

    void import("@/lib/sqlite/model/ai-planning-session")
      .then(({ actionUpdateLocalAiPlanningSessionJob }) =>
        actionUpdateLocalAiPlanningSessionJob(
          buildLocalPlanningJobUpdate(job, userId),
        ),
      )
      .then((localSession) => {
        queryClient.setQueryData(
          aiTripPlanningQueryKeys.localSession(
            localSession.id,
            localSession.userId,
          ),
          localSession,
        );
        void queryClient.invalidateQueries({
          queryKey: aiTripPlanningQueryKeys.localSessions(localSession.userId),
        });
      })
      .catch((error) => {
        console.error("Failed to persist AI planning job progress", error);
      });
  }, [query.data, queryClient, updatedAt, userId]);

  useEffect(() => {
    if (
      !sessionId ||
      (status !== "completed" && status !== "failed" && status !== "cancelled")
    ) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: aiTripPlanningQueryKeys.session(sessionId),
    });
  }, [queryClient, sessionId, status]);

  return {
    ...query,
    isPollingTimedOut,
    resumePolling,
  };
}

export function useCancelPlanningJob(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await planningApiClient.cancelPlanningJob(jobId);
      const { actionUpdateLocalAiPlanningSessionJob } =
        await import("@/lib/sqlite/model/ai-planning-session");
      const localSession = await actionUpdateLocalAiPlanningSessionJob(
        buildLocalPlanningJobUpdate(response.data, userId),
      );

      return { job: response.data, localSession };
    },
    onSuccess: ({ job, localSession }) => {
      queryClient.setQueryData(aiTripPlanningQueryKeys.job(job.id), {
        data: job,
        retryAfterMs: null,
      } satisfies PlanningApiResponse<PlanningJob>);
      queryClient.setQueryData(
        aiTripPlanningQueryKeys.localSession(
          localSession.id,
          localSession.userId,
        ),
        localSession,
      );

      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: aiTripPlanningQueryKeys.session(job.sessionId),
        }),
        queryClient.invalidateQueries({
          queryKey: aiTripPlanningQueryKeys.localSessions(localSession.userId),
        }),
      ]);
    },
  });
}
