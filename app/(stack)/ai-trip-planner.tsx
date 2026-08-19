import { AiPlannerIntakeConversation } from "@/components/ai-trip-planner/intake-conversation";
import { AiPlannerPlanPreview } from "@/components/ai-trip-planner/plan-preview";
import {
  AiPlannerPlanningProgress,
  type PlanningProgressVariant,
} from "@/components/ai-trip-planner/planning-progress";
import { AiPlannerPlanningSessionRecovery } from "@/components/ai-trip-planner/planning-session-recovery";
import {
  AiPlannerRefinementConversation,
  type AiPlannerRefinementMessage,
} from "@/components/ai-trip-planner/refinement-conversation";
import { AppHeader } from "@/components/header/app-header";
import { HeaderCloseButton } from "@/components/header/icon-button";
import { TitleRegular } from "@/components/title/regular";
import { Dialog } from "@/components/ui/dialog";
import { borderRadiuses, colors, gaps, getColor } from "@/constants/theme";
import {
  aiTripPlanningQueryKeys,
  buildPlanningMutationId,
  inferRecoveredPlanningOperation,
  isTerminalPlanningJob,
  selectLatestRecoverableAiPlanningSession,
  useCancelPlanningJob,
  useCreatePlanningRefinement,
  useCreatePlanningSession,
  useLocalAiPlanningSessions,
  usePlanningJob,
  usePlanningSession,
} from "@/hook/use-ai-trip-planning";
import { useAuthSession } from "@/hook/use-auth-session";
import { isPlanningApiError } from "@/lib/ai-trip-planning/errors";
import { adaptPlanningResultToPlanPreview } from "@/lib/ai-trip-planning/plan-adapter";
import { buildCreatePlanningSessionRequest } from "@/lib/ai-trip-planning/session-request";
import {
  actionImportAiPlanningResult,
  actionSyncImportedAiTrip,
} from "@/lib/ai-trip-planning/trip-import";
import {
  type CreatePlanningRefinementRequest,
  type PlanningResult,
} from "@/lib/ai-trip-planning/types";
import { type LocalAiPlanningSession } from "@/lib/sqlite/model/ai-planning-session";
import {
  type AiPlannerDraftSelection,
  type AiPlannerIntakeAnswers,
  type AiPlannerPlanViewModel,
} from "@/types/ai-trip-planner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { CalendarDays, MessageCircle } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PlannerView = "chat" | "draft";

type SubmissionAttempt = {
  answers: AiPlannerIntakeAnswers;
  request: ReturnType<typeof buildCreatePlanningSessionRequest>;
  idempotencyKey: string;
};

type RefinementAttempt = {
  request: CreatePlanningRefinementRequest;
  idempotencyKey: string;
  messageId?: string;
};

type ActivePlanningContext = {
  answers: AiPlannerIntakeAnswers;
  sessionId: string;
  jobId: string;
  operation: "initial" | "refinement";
  recovered?: boolean;
};

function getPlanningErrorMessage(error: unknown) {
  if (isPlanningApiError(error)) {
    return error.detail || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export default function AiTripPlannerScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuthSession();
  const userId = session?.user.id ?? null;
  const createPlanningSession = useCreatePlanningSession();
  const createPlanningRefinement = useCreatePlanningRefinement();
  const cancelPlanningJob = useCancelPlanningJob(userId ?? "");
  const [activeView, setActiveView] = useState<PlannerView>("chat");
  const [recoveryDismissed, setRecoveryDismissed] = useState(false);
  const [submissionAttempt, setSubmissionAttempt] =
    useState<SubmissionAttempt | null>(null);
  const [planningContext, setPlanningContext] =
    useState<ActivePlanningContext | null>(null);
  const [refinementAttempt, setRefinementAttempt] =
    useState<RefinementAttempt | null>(null);
  const [localSubmissionError, setLocalSubmissionError] = useState<
    string | null
  >(null);
  const [localRefinementError, setLocalRefinementError] = useState<
    string | null
  >(null);
  const [latestPlan, setLatestPlan] = useState<AiPlannerPlanViewModel | null>(
    null,
  );
  const [latestPlanningResult, setLatestPlanningResult] =
    useState<PlanningResult | null>(null);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [reviewSelection, setReviewSelection] =
    useState<AiPlannerDraftSelection>({
      itineraryItemIds: [],
      checklistItems: [],
    });
  const [localImportError, setLocalImportError] = useState<string | null>(null);
  const isImportingRef = useRef(false);
  const [openedDraftJobId, setOpenedDraftJobId] = useState<string | null>(null);
  const localPlanningSessions = useLocalAiPlanningSessions(userId);
  const recoverableSession = useMemo(
    () =>
      selectLatestRecoverableAiPlanningSession(
        localPlanningSessions.data ?? [],
      ),
    [localPlanningSessions.data],
  );
  const showRecovery = Boolean(
    recoverableSession && !recoveryDismissed && !planningContext,
  );
  const isCheckingRecovery = Boolean(
    userId &&
    localPlanningSessions.isPending &&
    !recoveryDismissed &&
    !planningContext,
  );
  const planningJob = usePlanningJob(planningContext?.jobId, userId, {
    enabled: Boolean(planningContext),
  });
  const planningSession = usePlanningSession(
    planningContext?.sessionId ??
      (showRecovery ? recoverableSession?.id : undefined),
    Boolean(planningContext) || showRecovery,
  );
  const job = planningJob.data;

  const completedJobPlan = useMemo(() => {
    if (job?.status !== "completed" || !planningContext) {
      return null;
    }

    return adaptPlanningResultToPlanPreview({
      result: job.result,
      revisionNumber: job.revisionNumber,
      startDate: planningContext.answers.startDate,
    });
  }, [job, planningContext]);

  const sessionPlan = useMemo(() => {
    const currentRevision = planningSession.data?.currentRevision;

    if (!currentRevision || !planningContext) {
      return null;
    }

    return adaptPlanningResultToPlanPreview({
      result: currentRevision.result,
      revisionNumber: currentRevision.revisionNumber,
      startDate: planningContext.answers.startDate,
    });
  }, [planningContext, planningSession.data?.currentRevision]);

  const resolvedPlan = completedJobPlan ?? sessionPlan;
  const livePlan = resolvedPlan ?? latestPlan;
  const resolvedPlanningResult =
    job?.status === "completed"
      ? job.result
      : (planningSession.data?.currentRevision?.result ?? null);
  const planningResult = resolvedPlanningResult ?? latestPlanningResult;

  useEffect(() => {
    if (resolvedPlan && resolvedPlanningResult) {
      setLatestPlan(resolvedPlan);
      setLatestPlanningResult(resolvedPlanningResult);
    }
  }, [resolvedPlan, resolvedPlanningResult]);

  useEffect(() => {
    if (!planningSession.data) {
      return;
    }

    const apiSession = planningSession.data;

    setPlanningContext((current) => {
      if (!current?.recovered || current.sessionId !== apiSession.id) {
        return current;
      }

      const operation = inferRecoveredPlanningOperation(
        current.jobId,
        apiSession.messages,
      );
      const answers = {
        destination: apiSession.initialRequest.destination,
        durationDays: apiSession.initialRequest.durationDays,
        startDate: current.answers.startDate,
        tripBrief: apiSession.initialRequest.tripBrief,
      };

      if (
        current.operation === operation &&
        current.answers.destination === answers.destination &&
        current.answers.durationDays === answers.durationDays &&
        current.answers.tripBrief === answers.tripBrief
      ) {
        return current;
      }

      return { ...current, answers, operation };
    });
  }, [planningSession.data]);

  const importTrip = useMutation({
    mutationFn: actionImportAiPlanningResult,
    onSuccess: (imported) => {
      setReviewVisible(false);
      queryClient.setQueryData(
        ["local-trip", imported.trip.id, imported.trip.userId],
        imported.trip,
      );
      void queryClient.invalidateQueries({
        queryKey: ["local-trips", imported.trip.userId],
      });
      void queryClient.invalidateQueries({
        queryKey: aiTripPlanningQueryKeys.localSessions(imported.trip.userId),
      });
      router.replace(`/trip/${imported.trip.id}`);

      void actionSyncImportedAiTrip(imported)
        .catch((error) => {
          console.error("AI trip saved locally; background sync failed", error);
        })
        .finally(() => {
          void Promise.all([
            queryClient.invalidateQueries({
              queryKey: ["local-trip", imported.trip.id, imported.trip.userId],
            }),
            queryClient.invalidateQueries({
              queryKey: ["local-trips", imported.trip.userId],
            }),
            queryClient.invalidateQueries({ queryKey: ["local-pins"] }),
            queryClient.invalidateQueries({
              queryKey: ["local-pin-locations"],
            }),
            queryClient.invalidateQueries({
              queryKey: ["local-checklist-items"],
            }),
            queryClient.invalidateQueries({ queryKey: ["local-notes"] }),
            queryClient.invalidateQueries({
              queryKey: ["local-reference-links"],
            }),
            queryClient.invalidateQueries({
              queryKey: ["local-trip-reference-links"],
            }),
          ]);
        });
    },
    onError: (error) => {
      console.error("AI trip import failed", error);
    },
    onSettled: () => {
      isImportingRef.current = false;
    },
  });

  const discardRecovery = useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { actionDeleteLocalAiPlanningSession } =
        await import("@/lib/sqlite/model/ai-planning-session");

      await actionDeleteLocalAiPlanningSession(id, userId);
    },
    onSuccess: (_, variables) => {
      queryClient.removeQueries({
        queryKey: aiTripPlanningQueryKeys.localSession(
          variables.id,
          variables.userId,
        ),
      });
      queryClient.setQueryData<LocalAiPlanningSession[]>(
        aiTripPlanningQueryKeys.localSessions(variables.userId),
        (sessions) =>
          sessions?.filter((session) => session.id !== variables.id) ?? [],
      );
    },
    onError: (error) => {
      setRecoveryDismissed(false);
      console.error("Failed to discard AI planning recovery", error);
    },
  });

  const itineraryItemCount = useMemo(
    () =>
      livePlan?.days.reduce((count, day) => count + day.items.length, 0) ?? 0,
    [livePlan],
  );

  const refinementMessages = useMemo<AiPlannerRefinementMessage[]>(() => {
    const messages =
      planningSession.data?.messages.map((message) => ({
        id: message.id,
        content: message.content,
      })) ?? [];

    if (
      refinementAttempt &&
      (!refinementAttempt.messageId ||
        !messages.some((message) => message.id === refinementAttempt.messageId))
    ) {
      messages.push({
        id: refinementAttempt.messageId ?? refinementAttempt.idempotencyKey,
        content: refinementAttempt.request.content,
      });
    }

    return messages;
  }, [planningSession.data?.messages, refinementAttempt]);

  const isRefinementJob = planningContext?.operation === "refinement";
  const isRefinementBusy =
    createPlanningRefinement.isPending ||
    Boolean(isRefinementJob && (!job || !isTerminalPlanningJob(job)));
  const canSubmitRefinement =
    Boolean(livePlan && planningContext) &&
    !isRefinementBusy &&
    !cancelPlanningJob.isPending;

  useEffect(() => {
    if (job?.status === "completed" && openedDraftJobId !== job.id) {
      setOpenedDraftJobId(job.id);
      setActiveView("draft");
    }
  }, [job, openedDraftJobId]);

  const executeSubmission = async (attempt: SubmissionAttempt) => {
    if (!userId) {
      setLocalSubmissionError("You must be signed in to plan a trip.");
      return;
    }

    setLocalSubmissionError(null);
    createPlanningSession.reset();

    try {
      const result = await createPlanningSession.mutateAsync({
        userId,
        startDate: attempt.answers.startDate,
        request: attempt.request,
        idempotencyKey: attempt.idempotencyKey,
      });

      setPlanningContext({
        answers: attempt.answers,
        sessionId: result.planningSession.id,
        jobId: result.planningSession.job.id,
        operation: "initial",
      });
    } catch (error) {
      // The mutation exposes its normalized error to the progress UI.
      console.error("Planning submission failed", error);
    }
  };

  const handleStartPlanning = (answers: AiPlannerIntakeAnswers) => {
    if (createPlanningSession.isPending) {
      return;
    }

    try {
      setRecoveryDismissed(true);
      const attempt = {
        answers,
        request: buildCreatePlanningSessionRequest(answers),
        idempotencyKey: buildPlanningMutationId(),
      } satisfies SubmissionAttempt;

      setSubmissionAttempt(attempt);
      setPlanningContext(null);
      setRefinementAttempt(null);
      setLatestPlan(null);
      setLatestPlanningResult(null);
      setOpenedDraftJobId(null);
      setLocalRefinementError(null);
      setLocalImportError(null);
      isImportingRef.current = false;
      importTrip.reset();
      createPlanningRefinement.reset();
      cancelPlanningJob.reset();
      void executeSubmission(attempt);
    } catch (error) {
      setLocalSubmissionError(getPlanningErrorMessage(error));
    }
  };

  const handleRetrySubmission = () => {
    if (submissionAttempt) {
      void executeSubmission(submissionAttempt);
    }
  };

  const handleRestartPlanning = () => {
    const answers = planningContext?.answers ?? submissionAttempt?.answers;

    if (!answers) {
      return;
    }

    handleStartPlanning(answers);
  };

  const handleEditAnswers = () => {
    setRecoveryDismissed(true);
    setSubmissionAttempt(null);
    setPlanningContext(null);
    setRefinementAttempt(null);
    setLatestPlan(null);
    setLatestPlanningResult(null);
    setOpenedDraftJobId(null);
    setLocalSubmissionError(null);
    setLocalRefinementError(null);
    setLocalImportError(null);
    isImportingRef.current = false;
    importTrip.reset();
    createPlanningSession.reset();
    createPlanningRefinement.reset();
    cancelPlanningJob.reset();
  };

  const handleContinueRecovery = () => {
    if (!recoverableSession?.activeJobId) {
      return;
    }

    const apiSession =
      planningSession.data?.id === recoverableSession.id
        ? planningSession.data
        : null;
    const operation = inferRecoveredPlanningOperation(
      recoverableSession.activeJobId,
      apiSession?.messages ?? [],
    );

    if (!apiSession) {
      void planningSession.refetch();
    }

    setRecoveryDismissed(true);
    setSubmissionAttempt(null);
    setRefinementAttempt(null);
    setLatestPlan(null);
    setLatestPlanningResult(null);
    setOpenedDraftJobId(null);
    setLocalSubmissionError(null);
    setLocalRefinementError(null);
    setLocalImportError(null);
    setPlanningContext({
      answers: {
        destination:
          apiSession?.initialRequest.destination ??
          recoverableSession.destination,
        durationDays:
          apiSession?.initialRequest.durationDays ??
          recoverableSession.durationDays,
        startDate: recoverableSession.startDate,
        tripBrief: apiSession?.initialRequest.tripBrief ?? "",
      },
      sessionId: recoverableSession.id,
      jobId: recoverableSession.activeJobId,
      operation,
      recovered: true,
    });
  };

  const handleStartNewFromRecovery = () => {
    if (!recoverableSession || !userId || discardRecovery.isPending) {
      return;
    }

    setRecoveryDismissed(true);
    discardRecovery.mutate({ id: recoverableSession.id, userId });
  };

  const executeRefinement = async (attempt: RefinementAttempt) => {
    if (!userId || !planningContext) {
      setLocalRefinementError(
        userId
          ? "The planning session is no longer available."
          : "You must be signed in to update this trip.",
      );
      return;
    }

    const { sessionId } = planningContext;

    setLocalRefinementError(null);
    createPlanningRefinement.reset();
    cancelPlanningJob.reset();

    try {
      const result = await createPlanningRefinement.mutateAsync({
        userId,
        sessionId,
        request: attempt.request,
        idempotencyKey: attempt.idempotencyKey,
      });

      setRefinementAttempt({
        ...attempt,
        messageId: result.refinement.messageId,
      });
      setPlanningContext((current) =>
        current?.sessionId === result.refinement.sessionId
          ? {
              ...current,
              jobId: result.refinement.job.id,
              operation: "refinement",
            }
          : current,
      );
      void planningSession.refetch();
    } catch (error) {
      // The mutation exposes its normalized error to the progress UI.
      console.error("Planning refinement failed", error);
    }
  };

  const handleSubmitRefinement = (request: CreatePlanningRefinementRequest) => {
    if (!canSubmitRefinement) {
      return;
    }

    const attempt = {
      request,
      idempotencyKey: buildPlanningMutationId(),
    } satisfies RefinementAttempt;

    setRefinementAttempt(attempt);
    void executeRefinement(attempt);
  };

  const handleRetryRefinementSubmission = () => {
    if (refinementAttempt) {
      void executeRefinement(refinementAttempt);
    }
  };

  const handleRestartRefinement = () => {
    if (!refinementAttempt) {
      return;
    }

    const attempt = {
      request: refinementAttempt.request,
      idempotencyKey: buildPlanningMutationId(),
    } satisfies RefinementAttempt;

    setRefinementAttempt(attempt);
    void executeRefinement(attempt);
  };

  const handleCancelPlanning = () => {
    if (!planningContext?.jobId || !userId) {
      return;
    }

    cancelPlanningJob.mutate(planningContext.jobId);
  };

  const handleReviewDraft = (selection: AiPlannerDraftSelection) => {
    setReviewSelection(selection);
    setLocalImportError(null);
    isImportingRef.current = false;
    importTrip.reset();
    setReviewVisible(true);
  };

  const handleDismissReview = () => {
    if (!importTrip.isPending) {
      setReviewVisible(false);
    }
  };

  const handleImportTrip = () => {
    if (isImportingRef.current || importTrip.isPending) {
      return;
    }

    if (!userId || !planningContext || !planningResult) {
      setLocalImportError(
        userId
          ? "This completed draft is no longer available."
          : "You must be signed in to create this trip.",
      );
      return;
    }

    setLocalImportError(null);
    isImportingRef.current = true;
    importTrip.mutate({
      userId,
      sessionId: planningContext.sessionId,
      startDate: planningContext.answers.startDate,
      result: planningResult,
      selection: reviewSelection,
    });
  };

  const submissionError =
    localSubmissionError ||
    (createPlanningSession.error
      ? getPlanningErrorMessage(createPlanningSession.error)
      : null);
  const refinementError =
    localRefinementError ||
    (createPlanningRefinement.error
      ? getPlanningErrorMessage(createPlanningRefinement.error)
      : null);
  const importError =
    localImportError ||
    (importTrip.error ? getPlanningErrorMessage(importTrip.error) : null);
  const canEdit =
    !planningContext || job?.status === "failed" || job?.status === "cancelled";
  const isPlanningStarted =
    Boolean(submissionAttempt) || Boolean(planningContext);
  let progressVariant: PlanningProgressVariant | null = null;
  let progressTitle: string | undefined;
  let progressMessage: string | null = null;
  let primaryAction:
    | { label: string; onPress: () => void; disabled?: boolean }
    | undefined;
  let secondaryAction:
    | { label: string; onPress: () => void; disabled?: boolean }
    | undefined;

  if (livePlan) {
    if (createPlanningRefinement.isPending) {
      progressVariant = "submitting";
      progressTitle = "Sending your changes";
      progressMessage = "Adding your feedback to this planning session…";
    } else if (refinementError) {
      progressVariant = "submission-error";
      progressTitle = "We couldn’t send your changes";
      progressMessage = refinementError;
      primaryAction = {
        label: "Try again",
        onPress: handleRetryRefinementSubmission,
        disabled: !refinementAttempt,
      };
    } else if (isRefinementJob) {
      if (cancelPlanningJob.isError) {
        progressVariant = "polling-error";
        progressTitle = "We couldn’t cancel this update";
        progressMessage = getPlanningErrorMessage(cancelPlanningJob.error);
        primaryAction = {
          label: "Check again",
          onPress: () => {
            cancelPlanningJob.reset();
            void planningJob.refetch();
          },
        };
      } else if (job?.status === "completed") {
        progressVariant = "completed";
        progressTitle = `Draft #${job.revisionNumber} is ready`;
        progressMessage = "Your feedback has been applied to the itinerary.";
        primaryAction = {
          label: "View draft",
          onPress: () => setActiveView("draft"),
        };
      } else if (job?.status === "failed") {
        progressVariant = "failed";
        progressTitle = "We couldn’t update this draft";
        progressMessage = job.message;
        primaryAction = {
          label: "Try changes again",
          onPress: handleRestartRefinement,
          disabled: !refinementAttempt,
        };
      } else if (job?.status === "cancelled") {
        progressVariant = "cancelled";
        progressTitle = "Draft update cancelled";
        progressMessage =
          "Your previous draft is still available and hasn’t been changed.";
        primaryAction = {
          label: "Try changes again",
          onPress: handleRestartRefinement,
          disabled: !refinementAttempt,
        };
      } else if (planningJob.isPollingTimedOut) {
        progressVariant = "timed-out";
        progressTitle = "This update is taking longer than expected";
        primaryAction = {
          label: "Check again",
          onPress: planningJob.resumePolling,
        };
        secondaryAction = {
          label: cancelPlanningJob.isPending ? "Cancelling…" : "Cancel update",
          onPress: handleCancelPlanning,
          disabled: cancelPlanningJob.isPending,
        };
      } else if (planningJob.isError) {
        progressVariant = "polling-error";
        progressMessage = getPlanningErrorMessage(planningJob.error);
        primaryAction = {
          label: "Check again",
          onPress: () => void planningJob.refetch(),
        };
        secondaryAction = {
          label: cancelPlanningJob.isPending ? "Cancelling…" : "Cancel update",
          onPress: handleCancelPlanning,
          disabled: cancelPlanningJob.isPending,
        };
      } else {
        progressVariant = "running";
        progressTitle = "Updating your draft";
        progressMessage =
          job && "progress" in job
            ? job.progress.message
            : "Your draft update is queued.";
        secondaryAction = {
          label: cancelPlanningJob.isPending ? "Cancelling…" : "Cancel update",
          onPress: handleCancelPlanning,
          disabled: cancelPlanningJob.isPending,
        };
      }
    }
  } else if (createPlanningSession.isPending) {
    progressVariant = "submitting";
  } else if (submissionError && !planningContext) {
    progressVariant = "submission-error";
    progressMessage = submissionError;
    primaryAction = {
      label: "Try again",
      onPress: handleRetrySubmission,
      disabled: !submissionAttempt,
    };
  } else if (planningContext) {
    if (cancelPlanningJob.isError) {
      progressVariant = "polling-error";
      progressMessage = getPlanningErrorMessage(cancelPlanningJob.error);
      primaryAction = {
        label: "Check again",
        onPress: () => {
          cancelPlanningJob.reset();
          void planningJob.refetch();
        },
      };
    } else if (job?.status === "completed") {
      progressVariant = "completed";
      primaryAction = {
        label: "View draft",
        onPress: () => setActiveView("draft"),
      };
    } else if (job?.status === "failed") {
      progressVariant = "failed";
      progressMessage = job.message;
      primaryAction = {
        label: "Start again",
        onPress: handleRestartPlanning,
      };
    } else if (job?.status === "cancelled") {
      progressVariant = "cancelled";
      primaryAction = {
        label: "Start again",
        onPress: handleRestartPlanning,
      };
    } else if (planningJob.isPollingTimedOut) {
      progressVariant = "timed-out";
      primaryAction = {
        label: "Check again",
        onPress: planningJob.resumePolling,
      };
      secondaryAction = {
        label: cancelPlanningJob.isPending ? "Cancelling…" : "Cancel planning",
        onPress: handleCancelPlanning,
        disabled: cancelPlanningJob.isPending,
      };
    } else if (planningJob.isError) {
      progressVariant = "polling-error";
      progressMessage = getPlanningErrorMessage(planningJob.error);
      primaryAction = {
        label: "Check again",
        onPress: () => void planningJob.refetch(),
      };
      secondaryAction = {
        label: cancelPlanningJob.isPending ? "Cancelling…" : "Cancel planning",
        onPress: handleCancelPlanning,
        disabled: cancelPlanningJob.isPending,
      };
    } else {
      progressVariant = "running";
      progressMessage =
        job && "progress" in job
          ? job.progress.message
          : "Your planning job is queued.";
      secondaryAction = {
        label: cancelPlanningJob.isPending ? "Cancelling…" : "Cancel planning",
        onPress: handleCancelPlanning,
        disabled: cancelPlanningJob.isPending,
      };
    }
  }

  const planningProgress = progressVariant ? (
    <AiPlannerPlanningProgress
      variant={progressVariant}
      title={progressTitle}
      message={progressMessage}
      primaryAction={primaryAction}
      secondaryAction={secondaryAction}
    />
  ) : null;
  const headerBadge = showRecovery
    ? "Recent"
    : isRefinementBusy
      ? "Updating"
      : livePlan
        ? `Draft #${livePlan.revision}`
        : planningContext
          ? "Planning"
          : "New";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.frame}>
          <AppHeader
            title="Plan with AI"
            subtitle={
              showRecovery
                ? "Planning saved on this device"
                : planningContext
                  ? `${planningContext.answers.destination} planning session`
                  : "New planning session"
            }
            sideWidth={72}
            leading={
              <HeaderCloseButton
                accessibilityLabel="Close AI trip planner"
                onPress={() => router.back()}
              />
            }
            trailing={
              <View style={styles.revisionBadge}>
                <TitleRegular size="xxs" weight="600" color={colors.purple}>
                  {headerBadge}
                </TitleRegular>
              </View>
            }
          />

          <View style={styles.tabsWrapper}>
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, activeView === "chat" && styles.activeTab]}
                onPress={() => setActiveView("chat")}
              >
                <MessageCircle
                  size={17}
                  color={getColor(
                    activeView === "chat"
                      ? colors.purple
                      : colors.textLightGrey,
                  )}
                />
                <TitleRegular
                  size="sm"
                  weight="600"
                  color={
                    activeView === "chat" ? colors.purple : colors.textLightGrey
                  }
                >
                  Chat
                </TitleRegular>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeView === "draft" && styles.activeTab,
                  !livePlan && styles.disabledTab,
                ]}
                onPress={() => setActiveView("draft")}
                disabled={!livePlan}
              >
                <CalendarDays
                  size={17}
                  color={getColor(
                    activeView === "draft"
                      ? colors.purple
                      : colors.textLightGrey,
                  )}
                />
                <TitleRegular
                  size="sm"
                  weight="600"
                  color={
                    activeView === "draft"
                      ? colors.purple
                      : colors.textLightGrey
                  }
                >
                  Trip draft
                </TitleRegular>
                {livePlan ? (
                  <View style={styles.itemCount}>
                    <TitleRegular size="xxs" weight="700" color={colors.purple}>
                      {itineraryItemCount}
                    </TitleRegular>
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.body}>
            <View
              style={[
                styles.viewPane,
                activeView !== "chat" && styles.hiddenPane,
              ]}
            >
              {isCheckingRecovery ? (
                <View style={styles.recoveryLoading}>
                  <ActivityIndicator color={getColor(colors.purple)} />
                </View>
              ) : showRecovery && recoverableSession ? (
                <AiPlannerPlanningSessionRecovery
                  session={recoverableSession}
                  onContinue={handleContinueRecovery}
                  onStartNew={handleStartNewFromRecovery}
                />
              ) : livePlan ? (
                <AiPlannerRefinementConversation
                  draftRevision={livePlan.revision}
                  messages={refinementMessages}
                  canSubmit={canSubmitRefinement}
                  planningProgress={planningProgress}
                  onSubmit={handleSubmitRefinement}
                />
              ) : (
                <AiPlannerIntakeConversation
                  canEdit={canEdit}
                  isPlanningStarted={isPlanningStarted}
                  planningProgress={planningProgress}
                  onEditAnswers={handleEditAnswers}
                  onStartPlanning={handleStartPlanning}
                />
              )}
            </View>
            {livePlan ? (
              <View
                style={[
                  styles.viewPane,
                  activeView !== "draft" && styles.hiddenPane,
                ]}
              >
                <AiPlannerPlanPreview
                  key={`draft-${livePlan.revision}`}
                  plan={livePlan}
                  onAskForChanges={() => setActiveView("chat")}
                  onReview={handleReviewDraft}
                />
              </View>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>

      <Dialog
        title="Review your trip"
        visible={reviewVisible}
        onDismiss={handleDismissReview}
        onConfirm={handleImportTrip}
        dismissible={!importTrip.isPending}
        cancelText="Keep editing"
        confirmText={importTrip.isPending ? "Creating trip…" : "Looks good"}
      >
        <View style={styles.reviewContent}>
          <View style={styles.reviewRow}>
            <TitleRegular size="xs" color={colors.textLightGrey}>
              Trip
            </TitleRegular>
            <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
              {livePlan?.destination} · {livePlan?.dateRange}
            </TitleRegular>
          </View>
          <View style={styles.reviewRow}>
            <TitleRegular size="xs" color={colors.textLightGrey}>
              Selected
            </TitleRegular>
            <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
              {reviewSelection.itineraryItemIds.length} itinerary items
            </TitleRegular>
          </View>
          <View style={styles.reviewRow}>
            <TitleRegular size="xs" color={colors.textLightGrey}>
              Checklist
            </TitleRegular>
            <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
              {reviewSelection.checklistItems.length} preparation items
            </TitleRegular>
          </View>
          <View style={styles.importReviewNotice}>
            <TitleRegular size="xs" color={colors.pineGreen}>
              Your selections will be saved locally first, then synced in the
              background.
            </TitleRegular>
          </View>
          {importError ? (
            <View style={styles.importError}>
              <TitleRegular size="xs" color={colors.red}>
                {importError}
              </TitleRegular>
            </View>
          ) : null}
        </View>
      </Dialog>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: getColor(colors.textDarkGrey, 0.16),
  },
  keyboardView: { flex: 1 },
  frame: {
    flex: 1,
    width: "100%",
    maxWidth: 780,
    alignSelf: "center",
    backgroundColor: "#F7F7FA",
  },
  revisionBadge: {
    minWidth: 64,
    alignItems: "center",
    paddingHorizontal: gaps.xs,
    paddingVertical: 6,
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.purple, 0.1),
  },
  tabsWrapper: {
    backgroundColor: getColor(colors.white),
    paddingHorizontal: gaps.md,
    paddingVertical: gaps.xs,
  },
  tabs: {
    flexDirection: "row",
    padding: 3,
    borderRadius: borderRadiuses.sm,
    backgroundColor: getColor(colors.whiteGrey, 0.35),
  },
  tab: {
    flex: 1,
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xs,
    borderRadius: 6,
  },
  activeTab: { backgroundColor: getColor(colors.white) },
  disabledTab: { opacity: 0.45 },
  itemCount: {
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.purple, 0.12),
  },
  body: { flex: 1 },
  viewPane: { flex: 1 },
  hiddenPane: { display: "none" },
  recoveryLoading: { flex: 1, alignItems: "center", justifyContent: "center" },
  reviewContent: { gap: gaps.sm },
  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: gaps.md,
  },
  importReviewNotice: {
    marginTop: gaps.xs,
    padding: gaps.sm,
    borderRadius: borderRadiuses.sm,
    backgroundColor: getColor(colors.pineGreen, 0.09),
  },
  importError: {
    padding: gaps.sm,
    borderRadius: borderRadiuses.sm,
    backgroundColor: getColor(colors.red, 0.08),
  },
});
