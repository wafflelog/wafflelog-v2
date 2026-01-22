import { UIText } from "@/components/ui/text";
import { colors, getColor } from "@/constants/theme";
import { type Expense } from "@/types/pin";
import { DollarSign as DollarSignIcon } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

type CardPinExpenseRegularProps = {
  expense: Expense;
  onPress: () => void;
};

export function CardPinExpenseRegular({
  expense,
  onPress,
}: CardPinExpenseRegularProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <DollarSignIcon size={20} color={getColor(colors.pineGreen)} />
      </View>

      <View style={styles.content}>
        <UIText style={styles.title} weight="600">
          {expense.description}
        </UIText>

        <UIText style={styles.url}>Paid by {expense.paidBy.fullname}</UIText>
      </View>

      <View style={styles.right}>
        <UIText style={styles.amount} weight="600">
          {expense.amount} {expense.currency.toUpperCase()}
        </UIText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  title: {
    fontSize: 14,
  },
  amount: {
    fontSize: 13,
  },
  url: {
    fontSize: 12,
    color: getColor(colors.purple),
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
