import { AiPlannerIntakeConversation } from "@/components/ai-trip-planner/intake-conversation";
import { AiPlannerPlanPreview } from "@/components/ai-trip-planner/plan-preview";
import {
  AiPlannerPlanningProgress,
  type PlanningProgressVariant,
} from "@/components/ai-trip-planner/planning-progress";
import { TitleRegular } from "@/components/title/regular";
import { Dialog } from "@/components/ui/dialog";
import { borderRadiuses, colors, gaps, getColor } from "@/constants/theme";
import {
  buildPlanningMutationId,
  useCancelPlanningJob,
  useCreatePlanningSession,
  usePlanningJob,
} from "@/hook/use-ai-trip-planning";
import { useAuthSession } from "@/hook/use-auth-session";
import { isPlanningApiError } from "@/lib/ai-trip-planning/errors";
import { adaptPlanningResultToPlanPreview } from "@/lib/ai-trip-planning/plan-adapter";
import { buildCreatePlanningSessionRequest } from "@/lib/ai-trip-planning/session-request";
import { type AiPlannerIntakeAnswers } from "@/types/ai-trip-planner";
import { useRouter } from "expo-router";
import { CalendarDays, MessageCircle, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
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

type ActivePlanningContext = {
  answers: AiPlannerIntakeAnswers;
  sessionId: string;
  jobId: string;
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
  const { session } = useAuthSession();
  const userId = session?.user.id ?? null;
  const createPlanningSession = useCreatePlanningSession();
  const cancelPlanningJob = useCancelPlanningJob(userId ?? "");
  const [activeView, setActiveView] = useState<PlannerView>("chat");
  const [submissionAttempt, setSubmissionAttempt] =
    useState<SubmissionAttempt | null>(null);
  const [planningContext, setPlanningContext] =
    useState<ActivePlanningContext | null>(null);
  const [localSubmissionError, setLocalSubmissionError] = useState<
    string | null
  >(null);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [reviewSelection, setReviewSelection] = useState({
    itineraryItemCount: 0,
    checklistItemCount: 0,
  });
  const [openedDraftJobId, setOpenedDraftJobId] = useState<string | null>(null);
  const planningJob = usePlanningJob(planningContext?.jobId, userId, {
    enabled: Boolean(planningContext),
  });
  const job = planningJob.data;

  const livePlan = useMemo(() => {
    if (job?.status !== "completed" || !planningContext) {
      return null;
    }

    return adaptPlanningResultToPlanPreview({
      result: job.result,
      revisionNumber: job.revisionNumber,
      startDate: planningContext.answers.startDate,
    });
  }, [job, planningContext]);

  const itineraryItemCount = useMemo(
    () =>
      livePlan?.days.reduce((count, day) => count + day.items.length, 0) ?? 0,
    [livePlan],
  );

  useEffect(() => {
    if (
      livePlan &&
      planningContext &&
      openedDraftJobId !== planningContext.jobId
    ) {
      setOpenedDraftJobId(planningContext.jobId);
      setActiveView("draft");
    }
  }, [livePlan, openedDraftJobId, planningContext]);

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
      const attempt = {
        answers,
        request: buildCreatePlanningSessionRequest(answers),
        idempotencyKey: buildPlanningMutationId(),
      } satisfies SubmissionAttempt;

      setSubmissionAttempt(attempt);
      setPlanningContext(null);
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
    setSubmissionAttempt(null);
    setPlanningContext(null);
    setLocalSubmissionError(null);
    createPlanningSession.reset();
    cancelPlanningJob.reset();
  };

  const handleCancelPlanning = () => {
    if (!planningContext?.jobId || !userId) {
      return;
    }

    cancelPlanningJob.mutate(planningContext.jobId);
  };

  const submissionError =
    localSubmissionError ||
    (createPlanningSession.error
      ? getPlanningErrorMessage(createPlanningSession.error)
      : null);
  const canEdit =
    !planningContext || job?.status === "failed" || job?.status === "cancelled";
  const isPlanningStarted =
    Boolean(submissionAttempt) || Boolean(planningContext);
  let progressVariant: PlanningProgressVariant | null = null;
  let progressMessage: string | null = null;
  let primaryAction:
    | { label: string; onPress: () => void; disabled?: boolean }
    | undefined;
  let secondaryAction:
    | { label: string; onPress: () => void; disabled?: boolean }
    | undefined;

  if (createPlanningSession.isPending) {
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
      message={progressMessage}
      primaryAction={primaryAction}
      secondaryAction={secondaryAction}
    />
  ) : null;
  const headerBadge = livePlan
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
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
              accessibilityLabel="Close AI trip planner"
            >
              <X size={22} color={getColor(colors.textDarkGrey)} />
            </TouchableOpacity>
            <View style={styles.headerTitle}>
              <TitleRegular size="md" weight="700" color={colors.textDarkGrey}>
                Plan with AI
              </TitleRegular>
              <TitleRegular size="xxs" color={colors.textLightGrey}>
                {planningContext
                  ? `${planningContext.answers.destination} planning session`
                  : "New planning session"}
              </TitleRegular>
            </View>
            <View style={styles.revisionBadge}>
              <TitleRegular size="xxs" weight="600" color={colors.purple}>
                {headerBadge}
              </TitleRegular>
            </View>
          </View>

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
              <AiPlannerIntakeConversation
                canEdit={canEdit}
                isPlanningStarted={isPlanningStarted}
                planningProgress={planningProgress}
                onEditAnswers={handleEditAnswers}
                onStartPlanning={handleStartPlanning}
              />
            </View>
            {livePlan ? (
              <View
                style={[
                  styles.viewPane,
                  activeView !== "draft" && styles.hiddenPane,
                ]}
              >
                <AiPlannerPlanPreview
                  plan={livePlan}
                  onAskForChanges={() => setActiveView("chat")}
                  onReview={(selection) => {
                    setReviewSelection(selection);
                    setReviewVisible(true);
                  }}
                />
              </View>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>

      <Dialog
        title="Review your trip"
        visible={reviewVisible}
        onDismiss={() => setReviewVisible(false)}
        onConfirm={() => setReviewVisible(false)}
        cancelText="Keep editing"
        confirmText="Looks good"
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
              {reviewSelection.itineraryItemCount} itinerary items
            </TitleRegular>
          </View>
          <View style={styles.reviewRow}>
            <TitleRegular size="xs" color={colors.textLightGrey}>
              Checklist
            </TitleRegular>
            <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
              {reviewSelection.checklistItemCount} preparation items
            </TitleRegular>
          </View>
          <View style={styles.prototypeReviewNotice}>
            <TitleRegular size="xs" color={colors.orange}>
              Draft review only—creating Wafflelog records is the next
              milestone.
            </TitleRegular>
          </View>
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
  header: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: gaps.sm,
    borderBottomWidth: 1,
    borderBottomColor: getColor(colors.whiteGrey, 0.65),
    backgroundColor: getColor(colors.white),
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.whiteGrey, 0.35),
  },
  headerTitle: { flex: 1, alignItems: "center", gap: 2 },
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
  reviewContent: { gap: gaps.sm },
  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: gaps.md,
  },
  prototypeReviewNotice: {
    marginTop: gaps.xs,
    padding: gaps.sm,
    borderRadius: borderRadiuses.sm,
    backgroundColor: getColor(colors.orange, 0.09),
  },
});
