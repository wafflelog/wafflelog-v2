import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
} from "@/constants/theme";
import { type LocalAiPlanningSessionStatus } from "@/lib/sqlite/model/ai-planning-session";
import dayjs from "dayjs";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  History,
  MapPin,
  Plus,
  Smartphone,
} from "lucide-react-native";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

type RecoverablePlanningStatus = Exclude<
  LocalAiPlanningSessionStatus,
  "imported"
>;

export type AiPlannerRecoverySessionPreview = {
  destination: string;
  durationDays: number;
  startDate: string;
  status: RecoverablePlanningStatus;
  updatedAt: string;
};

type AiPlannerPlanningSessionRecoveryProps = {
  session: AiPlannerRecoverySessionPreview;
  onContinue: () => void;
  onStartNew: () => void;
};

function getStatusPresentation(status: RecoverablePlanningStatus) {
  if (status === "completed") {
    return { label: "Draft ready", color: colors.pineGreen };
  }

  if (status === "failed") {
    return { label: "Needs attention", color: colors.red };
  }

  if (status === "cancelled") {
    return { label: "Planning paused", color: colors.orange };
  }

  return { label: "Planning in progress", color: colors.purple };
}

export function AiPlannerPlanningSessionRecovery({
  session,
  onContinue,
  onStartNew,
}: AiPlannerPlanningSessionRecoveryProps) {
  const status = getStatusPresentation(session.status);
  const durationLabel = `${session.durationDays} ${
    session.durationDays === 1 ? "day" : "days"
  }`;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.intro}>
        <View style={styles.introIcon}>
          <History size={23} color={getColor(colors.purple)} />
        </View>
        <TitleRegular size="xl" color={colors.textDarkGrey}>
          Pick up where you left off
        </TitleRegular>
        <TitleRegular
          size="sm"
          color={colors.textLightGrey}
          style={styles.introText}
        >
          You have an unfinished planning session saved on this device.
        </TitleRegular>
      </View>

      <View style={styles.sessionCard}>
        <View style={styles.cardHeading}>
          <TitleRegular size="xs" weight="600" color={colors.textLightGrey}>
            RECENT PLAN
          </TitleRegular>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getColor(status.color, 0.11) },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getColor(status.color) },
              ]}
            />
            <TitleRegular size="xxs" weight="600" color={status.color}>
              {status.label}
            </TitleRegular>
          </View>
        </View>

        <View style={styles.destinationRow}>
          <View style={styles.destinationIcon}>
            <MapPin size={20} color={getColor(colors.purple)} />
          </View>
          <View style={styles.destinationCopy}>
            <TitleRegular size="xs" color={colors.textLightGrey}>
              Destination
            </TitleRegular>
            <TitleRegular size="lg" weight="600" color={colors.textDarkGrey}>
              {session.destination}
            </TitleRegular>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detail}>
            <CalendarDays size={16} color={getColor(colors.pineGreen)} />
            <View>
              <TitleRegular size="xxs" color={colors.textLightGrey}>
                Starts
              </TitleRegular>
              <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
                {dayjs(session.startDate).format("D MMMM YYYY")}
              </TitleRegular>
            </View>
          </View>
          <View style={styles.detail}>
            <Clock3 size={16} color={getColor(colors.pineGreen)} />
            <View>
              <TitleRegular size="xxs" color={colors.textLightGrey}>
                Trip length
              </TitleRegular>
              <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
                {durationLabel}
              </TitleRegular>
            </View>
          </View>
        </View>

        <View style={styles.savedRow}>
          <Smartphone size={14} color={getColor(colors.textLightGrey)} />
          <TitleRegular size="xxs" color={colors.textLightGrey}>
            Saved on this device · Updated {dayjs(session.updatedAt).format(
              "D MMM, HH:mm",
            )}
          </TitleRegular>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={onContinue}
          activeOpacity={0.8}
          accessibilityLabel={`Continue planning ${session.destination}`}
        >
          <TitleRegular size="sm" weight="600" color={colors.white}>
            Continue planning
          </TitleRegular>
          <ArrowRight size={18} color={getColor(colors.white)} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.newButton}
        onPress={onStartNew}
        activeOpacity={0.75}
        accessibilityLabel="Start a new AI trip plan"
      >
        <Plus size={18} color={getColor(colors.purple)} />
        <TitleRegular size="sm" weight="600" color={colors.purple}>
          Start a new trip instead
        </TitleRegular>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    justifyContent: "center",
    padding: gaps.md,
    paddingBottom: gaps.xl,
    gap: gaps.md,
  },
  intro: {
    alignItems: "center",
    paddingHorizontal: gaps.md,
    paddingBottom: gaps.sm,
    gap: gaps.xs,
  },
  introIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: gaps.xxs,
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.purple, 0.12),
  },
  introText: { textAlign: "center", lineHeight: 20 },
  sessionCard: {
    padding: gaps.md,
    gap: gaps.md,
    borderWidth: 1,
    borderColor: getColor(colors.purple, 0.18),
    borderRadius: borderRadiuses.lg,
    backgroundColor: getColor(colors.white),
  },
  cardHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: gaps.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: gaps.xs,
    paddingVertical: gaps.xxs,
    borderRadius: borderRadiuses.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: borderRadiuses.full },
  destinationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
  },
  destinationIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadiuses.md,
    backgroundColor: getColor(colors.purple, 0.09),
  },
  destinationCopy: { flex: 1, gap: 2 },
  details: {
    flexDirection: "row",
    gap: gaps.xs,
  },
  detail: {
    flex: 1,
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.xs,
    padding: gaps.sm,
    borderRadius: borderRadiuses.md,
    backgroundColor: getColor(colors.whiteGrey, 0.25),
  },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  continueButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xs,
    borderRadius: borderRadiuses.sm,
    backgroundColor: getColor(colors.purple),
  },
  newButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xs,
    borderWidth: 1,
    borderColor: getColor(colors.purple, 0.3),
    borderRadius: borderRadiuses.sm,
    backgroundColor: getColor(colors.white, 0.7),
  },
});
