import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor } from "@/constants/theme";
import { type Expense } from "@/types/pin";
import { DollarSign as DollarSignIcon } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

type CardExpenseRegularProps = {
  expense: Expense;
  onPress: () => void;
};

export function CardExpenseRegular({
  expense,
  onPress,
}: CardExpenseRegularProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <DollarSignIcon size={20} color={getColor(colors.pineGreen)} />
      </View>

      <View style={styles.content}>
        <TitleRegular size="md" weight="600">
          {expense.description}
        </TitleRegular>

        <TitleRegular size="xs">Paid by {expense.paidBy.fullname}</TitleRegular>
      </View>

      <View style={styles.right}>
        <TitleRegular size="md" weight="600">
          {expense.amount} {expense.currency.toUpperCase()}
        </TitleRegular>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    backgroundColor: getColor(colors.pineGreen, 0.2),
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flexDirection: "column",
    flex: 1,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
