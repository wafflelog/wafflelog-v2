import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getCardBasicStyle,
  getColor,
} from "@/constants/theme";
import { StyleSheet, View } from "react-native";

type TripExpenseSummaryProps = {
  currency: string;
  totalSpent: string;
  youPaid: string;
  yourShare: string;
};

export function TripExpenseSummary({
  currency,
  totalSpent,
  youPaid,
  yourShare,
}: TripExpenseSummaryProps) {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <TitleRegular
          size="xxs"
          weight="700"
          color={colors.purple}
          style={styles.audienceLabel}
        >
          YOUR SPENDING
        </TitleRegular>

        <View style={styles.costSummary}>
          <TitleRegular size="xs" color={colors.textLightGrey}>
            Your trip cost
          </TitleRegular>
          <TitleRegular size="xl" weight="700">
            {yourShare} {currency}
          </TitleRegular>
        </View>

        <View style={styles.supportingMetrics}>
          <View style={styles.supportingMetric}>
            <TitleRegular size="xxs" color={colors.textLightGrey}>
              You paid upfront
            </TitleRegular>
            <TitleRegular size="xs" weight="600">
              {youPaid} {currency}
            </TitleRegular>
          </View>
          <View style={styles.supportingDivider} />
          <View style={styles.supportingMetric}>
            <TitleRegular size="xxs" color={colors.textLightGrey}>
              Trip total for all travellers
            </TitleRegular>
            <TitleRegular size="xs" weight="600">
              {totalSpent} {currency}
            </TitleRegular>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...getCardBasicStyle("md"),
    gap: gaps.md,
  },
  section: {
    gap: gaps.sm,
  },
  audienceLabel: {
    letterSpacing: 0.8,
  },
  costSummary: {
    gap: gaps.xxs,
    padding: gaps.sm,
    borderRadius: borderRadiuses.sm,
    backgroundColor: getColor(colors.waffle, 0.13),
  },
  supportingMetrics: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
  },
  supportingMetric: {
    minWidth: 0,
    flex: 1,
    gap: 2,
  },
  supportingDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: getColor(colors.whiteGrey, 0.7),
  },
});
