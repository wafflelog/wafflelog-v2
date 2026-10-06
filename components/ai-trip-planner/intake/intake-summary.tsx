import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
} from "@/constants/theme";
import { type AiPlannerIntakeAnswers } from "@/types/ai-trip-planner";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Pencil,
  Sparkles,
} from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import {
  INTAKE_FIELD_LABELS,
  INTAKE_FIELD_ORDER,
  formatIntakeAnswer,
  type IntakeField,
} from "./intake-config";

type AiPlannerIntakeSummaryProps = {
  answers: AiPlannerIntakeAnswers;
  canEdit: boolean;
  isPlanningStarted: boolean;
  onEdit: (field: IntakeField) => void;
  onStartPlanning: () => void;
};

const FIELD_ICONS = {
  destination: MapPin,
  startDate: CalendarDays,
  durationDays: Clock3,
  tripBrief: Sparkles,
};

export function AiPlannerIntakeSummary({
  answers,
  canEdit,
  isPlanningStarted,
  onEdit,
  onStartPlanning,
}: AiPlannerIntakeSummaryProps) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeading}>
        <CheckCircle2 size={20} color={getColor(colors.pineGreen)} />
        <View style={styles.summaryHeadingCopy}>
          <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
            Here&apos;s what I heard
          </TitleRegular>
          <TitleRegular size="xs" color={colors.textLightGrey}>
            Tap any answer if you want to change it.
          </TitleRegular>
        </View>
      </View>

      {INTAKE_FIELD_ORDER.map((field, index) => {
        const FieldIcon = FIELD_ICONS[field];
        const isLast = index === INTAKE_FIELD_ORDER.length - 1;
        const answer = formatIntakeAnswer(field, answers);
        const isBrief = field === "tripBrief";
        const displayAnswer =
          isBrief && answer.length > 180 ? `${answer.slice(0, 179)}…` : answer;

        return (
          <TouchableOpacity
            key={field}
            style={[styles.summaryRow, isLast && styles.summaryRowLast]}
            onPress={() => onEdit(field)}
            disabled={!canEdit}
            activeOpacity={0.7}
          >
            <View style={styles.summaryIcon}>
              <FieldIcon size={16} color={getColor(colors.purple)} />
            </View>
            <View style={styles.summaryCopy}>
              <TitleRegular size="xxs" color={colors.textLightGrey}>
                {INTAKE_FIELD_LABELS[field]}
              </TitleRegular>
              <TitleRegular
                size={isBrief ? "xs" : "sm"}
                weight={isBrief ? "400" : "600"}
                color={colors.textDarkGrey}
                style={isBrief ? styles.summaryBrief : undefined}
              >
                {displayAnswer}
              </TitleRegular>
            </View>
            {canEdit ? (
              <Pencil size={15} color={getColor(colors.textLightGrey)} />
            ) : null}
          </TouchableOpacity>
        );
      })}

      {!isPlanningStarted ? (
        <TouchableOpacity
          style={styles.startButton}
          onPress={onStartPlanning}
          activeOpacity={0.8}
        >
          <Sparkles size={17} color={getColor(colors.white)} />
          <TitleRegular size="sm" weight="600" color={colors.white}>
            Start planning
          </TitleRegular>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 560,
    borderRadius: borderRadiuses.lg,
    padding: gaps.md,
    backgroundColor: getColor(colors.white),
    borderWidth: 1,
    borderColor: getColor(colors.purple, 0.16),
    gap: gaps.xs,
  },
  summaryHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.xs,
    paddingBottom: gaps.xs,
  },
  summaryHeadingCopy: { flex: 1, gap: 2 },
  summaryRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.xs,
    paddingVertical: gaps.xs,
    borderBottomWidth: 1,
    borderBottomColor: getColor(colors.whiteGrey, 0.6),
  },
  summaryRowLast: { borderBottomWidth: 0 },
  summaryIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.purple, 0.08),
  },
  summaryCopy: { flex: 1, gap: 2 },
  summaryBrief: { lineHeight: 18 },
  startButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xs,
    marginTop: gaps.xs,
    borderRadius: borderRadiuses.sm,
    backgroundColor: getColor(colors.purple),
  },
});
