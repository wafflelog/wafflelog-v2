import { TitleRegular } from "@/components/title/regular";
import {
  colors,
  gaps,
  getCardBasicStyle,
} from "@/constants/theme";
import { StyleSheet, View } from "react-native";

type CurrencyBalance = {
  currency: string;
  youOwe: string;
  owedToYou: string;
};

type ExpenseBalanceOverviewProps = {
  balances: CurrencyBalance[];
};

function getBalanceSummary(
  balances: CurrencyBalance[],
  balanceKey: "youOwe" | "owedToYou",
) {
  const values = balances
    .filter((balance) => Number(balance[balanceKey]) > 0)
    .map((balance) => `${balance[balanceKey]} ${balance.currency}`);

  return values.length > 0 ? values.join(" + ") : "0";
}

export function ExpenseBalanceOverview({
  balances,
}: ExpenseBalanceOverviewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TitleRegular
          size="xs"
          weight="600"
          color={colors.textLightGrey}
          style={styles.label}
        >
          You owe
        </TitleRegular>
        <TitleRegular
          size="sm"
          weight="700"
          color={colors.red}
          style={styles.value}
        >
          {getBalanceSummary(balances, "youOwe")}
        </TitleRegular>
      </View>

      <View style={styles.row}>
        <TitleRegular
          size="xs"
          weight="600"
          color={colors.textLightGrey}
          style={styles.label}
        >
          You are owed
        </TitleRegular>
        <TitleRegular
          size="sm"
          weight="700"
          color={colors.positiveGreen}
          style={styles.value}
        >
          {getBalanceSummary(balances, "owedToYou")}
        </TitleRegular>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...getCardBasicStyle("sm"),
    gap: gaps.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: gaps.sm,
  },
  label: {
    width: 88,
  },
  value: {
    minWidth: 0,
    flex: 1,
    textAlign: "right",
  },
});
