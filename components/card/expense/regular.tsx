import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
} from "@/constants/theme";
import { getCreatorDisplayName } from "@/lib/helper/creator";
import { type Expense } from "@/types/pin";
import {
  ChevronDown,
  ChevronUp,
  DollarSign as DollarSignIcon,
  Trash2 as Trash2Icon,
} from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type CardExpenseRegularProps = {
  expense: Expense;
  onDeletePress?: () => void;
};

export function CardExpenseRegular({
  expense,
  onDeletePress,
}: CardExpenseRegularProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const currency = expense.currency.toUpperCase();
  const participantCount = expense.participants.length;
  const recorderName = getCreatorDisplayName(expense.creator);
  const hasBreakdown = participantCount > 1;

  return (
    <View style={styles.container}>
      <View
        style={styles.summaryMain}
      >
        <View style={styles.iconContainer}>
          <DollarSignIcon size={20} color={getColor(colors.pineGreen)} />
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <TitleRegular
              size="sm"
              weight="600"
              style={styles.description}
              numberOfLines={2}
            >
              {expense.description}
            </TitleRegular>
            <TitleRegular size="sm" weight="700" numberOfLines={1}>
              {expense.amount.toFixed(2)} {currency}
            </TitleRegular>
          </View>

          {expense.context ? (
            <TitleRegular size="xxs" color={colors.textLightGrey}>
              {expense.context}
            </TitleRegular>
          ) : null}

          <View style={styles.metadataRow}>
            <View style={styles.metadataText}>
              <TitleRegular size="xs" color={colors.textLightGrey}>
                Paid by {expense.paidBy.fullname}
              </TitleRegular>
              <TitleRegular size="xs" color={colors.textLightGrey}>
                Recorded by {recorderName}
              </TitleRegular>
            </View>
            {onDeletePress ? (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={onDeletePress}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Delete expense"
              >
                <Trash2Icon size={17} color={getColor(colors.red)} />
              </TouchableOpacity>
            ) : null}
          </View>

          {hasBreakdown ? (
            <TouchableOpacity
              style={styles.splitSummary}
              onPress={() => setIsExpanded((current) => !current)}
              activeOpacity={0.72}
              accessibilityRole="button"
              accessibilityState={{ expanded: isExpanded }}
            >
              <TitleRegular
                size="xs"
                color={colors.textDarkGrey}
                style={styles.splitText}
              >
                Split with {participantCount} people
              </TitleRegular>
              {isExpanded ? (
                <ChevronUp size={18} color={getColor(colors.textLightGrey)} />
              ) : (
                <ChevronDown
                  size={18}
                  color={getColor(colors.textLightGrey)}
                />
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {isExpanded && hasBreakdown ? (
        <View style={styles.breakdown}>
          <View style={styles.breakdownHeading}>
            <TitleRegular size="xs" weight="700">
              Split details
            </TitleRegular>
          </View>

          {expense.participants.map((participant) => (
            <View key={participant.id} style={styles.participant}>
              <TitleRegular size="xs" style={styles.participantName}>
                {participant.fullname}
              </TitleRegular>
              <TitleRegular size="xs" weight="600">
                {participant.splitAmount} {currency}
              </TitleRegular>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  summaryMain: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.pineGreen, 0.2),
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    minWidth: 0,
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: gaps.sm,
  },
  description: {
    minWidth: 0,
    flex: 1,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: gaps.xs,
  },
  metadataText: {
    minWidth: 0,
    flex: 1,
    gap: 3,
  },
  splitSummary: {
    minHeight: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: gaps.xs,
  },
  splitText: {
    minWidth: 0,
    flex: 1,
  },
  breakdown: {
    marginLeft: 40 + gaps.sm,
    marginTop: gaps.xs,
    paddingTop: gaps.xs,
    borderTopWidth: 1,
    borderTopColor: getColor(colors.whiteGrey, 0.7),
    gap: gaps.xxs,
  },
  breakdownHeading: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  participant: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.xs,
  },
  participantName: {
    minWidth: 0,
    flex: 1,
  },
});
