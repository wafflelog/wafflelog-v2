import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
} from "@/constants/theme";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Sparkles,
  XCircle,
} from "lucide-react-native";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export type PlanningProgressVariant =
  | "cancelled"
  | "completed"
  | "failed"
  | "polling-error"
  | "running"
  | "submission-error"
  | "submitting"
  | "timed-out";

type PlanningProgressAction = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

type AiPlannerPlanningProgressProps = {
  variant: PlanningProgressVariant;
  message?: string | null;
  primaryAction?: PlanningProgressAction;
  secondaryAction?: PlanningProgressAction;
};

const titles: Record<PlanningProgressVariant, string> = {
  cancelled: "Planning cancelled",
  completed: "Your trip draft is ready",
  failed: "The planner couldn’t finish this draft",
  "polling-error": "We lost contact with the planning service",
  running: "Planning your trip",
  "submission-error": "We couldn’t start planning",
  submitting: "Starting your planning session",
  "timed-out": "Planning is taking longer than expected",
};

const fallbackMessages: Record<PlanningProgressVariant, string> = {
  cancelled: "You can start again with the same answers whenever you’re ready.",
  completed: "Open the trip draft to review the suggestions.",
  failed: "Your answers are still here, so you can safely try again.",
  "polling-error": "The job is still saved. Check again when your connection is ready.",
  running: "Researching your destination and shaping the itinerary.",
  "submission-error": "Your answers are still here. Nothing has been lost.",
  submitting: "Sending your answers securely…",
  "timed-out":
    "The server job may still finish. You can check again or cancel it.",
};

function ProgressIcon({ variant }: { variant: PlanningProgressVariant }) {
  if (variant === "submitting" || variant === "running") {
    return <ActivityIndicator size="small" color={getColor(colors.purple)} />;
  }

  if (variant === "completed") {
    return <CheckCircle2 size={21} color={getColor(colors.pineGreen)} />;
  }

  if (variant === "cancelled") {
    return <XCircle size={21} color={getColor(colors.textLightGrey)} />;
  }

  if (variant === "timed-out") {
    return <Clock3 size={21} color={getColor(colors.orange)} />;
  }

  if (variant === "failed" || variant === "polling-error") {
    return <AlertCircle size={21} color={getColor(colors.red)} />;
  }

  return <Sparkles size={21} color={getColor(colors.orange)} />;
}

export function AiPlannerPlanningProgress({
  variant,
  message,
  primaryAction,
  secondaryAction,
}: AiPlannerPlanningProgressProps) {
  const isError =
    variant === "failed" ||
    variant === "polling-error" ||
    variant === "submission-error";

  return (
    <View
      style={[
        styles.card,
        isError && styles.errorCard,
        variant === "timed-out" && styles.warningCard,
      ]}
    >
      <View style={styles.icon}>
        <ProgressIcon variant={variant} />
      </View>
      <View style={styles.copy}>
        <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
          {titles[variant]}
        </TitleRegular>
        <TitleRegular size="xs" color={colors.textLightGrey}>
          {message || fallbackMessages[variant]}
        </TitleRegular>
        {primaryAction || secondaryAction ? (
          <View style={styles.actions}>
            {secondaryAction ? (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={secondaryAction.onPress}
                disabled={secondaryAction.disabled}
              >
                <TitleRegular size="xs" weight="600" color={colors.purple}>
                  {secondaryAction.label}
                </TitleRegular>
              </TouchableOpacity>
            ) : null}
            {primaryAction ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={primaryAction.onPress}
                disabled={primaryAction.disabled}
              >
                <TitleRegular size="xs" weight="600" color={colors.white}>
                  {primaryAction.label}
                </TitleRegular>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 560,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: gaps.sm,
    padding: gaps.sm,
    borderRadius: borderRadiuses.md,
    borderWidth: 1,
    borderColor: getColor(colors.purple, 0.18),
    backgroundColor: getColor(colors.purple, 0.06),
  },
  errorCard: {
    borderColor: getColor(colors.red, 0.2),
    backgroundColor: getColor(colors.red, 0.05),
  },
  warningCard: {
    borderColor: getColor(colors.orange, 0.22),
    backgroundColor: getColor(colors.orange, 0.07),
  },
  icon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.white, 0.8),
  },
  copy: { flex: 1, gap: gaps.xxs },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: gaps.xs,
    marginTop: gaps.xs,
  },
  secondaryButton: {
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: gaps.sm,
    borderRadius: borderRadiuses.sm,
    borderWidth: 1,
    borderColor: getColor(colors.purple, 0.3),
    backgroundColor: getColor(colors.white, 0.7),
  },
  primaryButton: {
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: gaps.sm,
    borderRadius: borderRadiuses.sm,
    backgroundColor: getColor(colors.purple),
  },
});
