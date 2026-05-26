import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor } from "@/constants/theme";
import { type Expense } from "@/types/pin";
import {
  DollarSign as DollarSignIcon,
  Trash2 as Trash2Icon,
} from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type CardExpenseRegularProps = {
  expense: Expense;
  onPress: () => void;
  onDeletePress?: () => void;
};

export function CardExpenseRegular({
  expense,
  onPress,
  onDeletePress,
}: CardExpenseRegularProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <DollarSignIcon size={20} color={getColor(colors.pineGreen)} />
      </View>

      <View style={styles.content}>
        <TitleRegular size="sm" weight="600">
          {expense.description}
        </TitleRegular>

        <TitleRegular size="xs">
          {[expense.context, `Paid by ${expense.paidBy.fullname}`]
            .filter(Boolean)
            .join(" · ")}
        </TitleRegular>
      </View>

      <View style={styles.right}>
        <TitleRegular size="sm" weight="600">
          {expense.amount} {expense.currency.toUpperCase()}
        </TitleRegular>
        {onDeletePress && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onDeletePress}
            hitSlop={8}
          >
            <Trash2Icon size={16} color={getColor(colors.red)} />
          </TouchableOpacity>
        )}
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
    gap: gaps.xs,
  },
  iconButton: {
    padding: gaps.xxs,
  },
});
