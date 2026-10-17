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
  youOwe: string;
  owedToYou: string;
};

export function TripExpenseSummary({
  currency,
  totalSpent,
  youOwe,
  owedToYou,
}: TripExpenseSummaryProps) {
  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <TitleRegular size="sm" weight="700" color={colors.purple}>
          Your position
        </TitleRegular>
        <TitleRegular size="xs" color={colors.textLightGrey}>
          {totalSpent} {currency} trip spending
        </TitleRegular>
      </View>

      <View style={styles.balances}>
        <View style={[styles.balance, styles.oweBalance]}>
          <TitleRegular size="xs" color={colors.textLightGrey}>
            You owe
          </TitleRegular>
          <TitleRegular size="lg" weight="700" color={colors.red}>
            {youOwe} {currency}
          </TitleRegular>
        </View>

        <View style={[styles.balance, styles.owedBalance]}>
          <TitleRegular size="xs" color={colors.textLightGrey}>
            Owed to you
          </TitleRegular>
          <TitleRegular size="lg" weight="700" color={colors.pineGreen}>
            {owedToYou} {currency}
          </TitleRegular>
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
  heading: {
    gap: gaps.xxs,
  },
  balances: {
    flexDirection: "row",
    gap: gaps.sm,
  },
  balance: {
    flex: 1,
    gap: gaps.xxs,
    padding: gaps.sm,
    borderRadius: borderRadiuses.sm,
  },
  oweBalance: {
    backgroundColor: getColor(colors.red, 0.08),
  },
  owedBalance: {
    backgroundColor: getColor(colors.turquoise, 0.1),
  },
});
