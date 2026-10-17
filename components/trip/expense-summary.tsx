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
  youOwe: string;
  owedToYou: string;
};

export function TripExpenseSummary({
  currency,
  totalSpent,
  youPaid,
  yourShare,
  youOwe,
  owedToYou,
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
          ALL TRAVELLERS
        </TitleRegular>

        <View style={styles.total}>
          <TitleRegular size="sm" weight="600">
            Total trip spend
          </TitleRegular>
          <TitleRegular size="xxl" weight="700">
            {totalSpent} {currency}
          </TitleRegular>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <TitleRegular
          size="xxs"
          weight="700"
          color={colors.purple}
          style={styles.audienceLabel}
        >
          YOUR SPENDING
        </TitleRegular>
        <View style={styles.metrics}>
          <View style={[styles.metric, styles.costMetric]}>
            <TitleRegular size="xs" color={colors.textLightGrey}>
              Your total share
            </TitleRegular>
            <TitleRegular size="lg" weight="700">
              {yourShare} {currency}
            </TitleRegular>
          </View>

          <View style={[styles.metric, styles.paidMetric]}>
            <TitleRegular size="xs" color={colors.textLightGrey}>
              You paid upfront
            </TitleRegular>
            <TitleRegular size="md" weight="700" color={colors.purple}>
              {youPaid} {currency}
            </TitleRegular>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <TitleRegular
          size="xxs"
          weight="700"
          color={colors.purple}
          style={styles.audienceLabel}
        >
          YOUR BALANCES
        </TitleRegular>
        <View style={styles.metrics}>
          <View style={[styles.metric, styles.oweMetric]}>
            <TitleRegular size="xs" color={colors.textLightGrey}>
              You owe
            </TitleRegular>
            <TitleRegular size="md" weight="700" color={colors.red}>
              {youOwe} {currency}
            </TitleRegular>
          </View>

          <View style={[styles.metric, styles.owedMetric]}>
            <TitleRegular size="xs" color={colors.textLightGrey}>
              Owed to you
            </TitleRegular>
            <TitleRegular size="md" weight="700" color={colors.pineGreen}>
              {owedToYou} {currency}
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
  total: {
    gap: gaps.xxs,
  },
  metrics: {
    flexDirection: "row",
    gap: gaps.sm,
  },
  metric: {
    minWidth: 0,
    flex: 1,
    gap: gaps.xxs,
    padding: gaps.sm,
    borderRadius: borderRadiuses.sm,
  },
  paidMetric: {
    backgroundColor: getColor(colors.purple, 0.08),
  },
  costMetric: {
    backgroundColor: getColor(colors.waffle, 0.13),
  },
  oweMetric: {
    backgroundColor: getColor(colors.red, 0.08),
  },
  owedMetric: {
    backgroundColor: getColor(colors.turquoise, 0.1),
  },
  divider: {
    height: 1,
    backgroundColor: getColor(colors.whiteGrey, 0.7),
  },
});
