import { Dialog } from "@/components/ui/dialog";
import { UIInputExpense } from "@/components/ui/input/expense";
import { UIInputText } from "@/components/ui/input/text";
import { borderRadiuses, colors, gaps, getColor } from "@/constants/theme";
import { Currency } from "@/types/pin";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

type DialogNewExpenseProps = {
  visible: boolean;
  onDismiss: () => void;
};

export const DialogNewExpense = ({
  visible,
  onDismiss,
}: DialogNewExpenseProps) => {
  const [expenseCurrency, setExpenseCurrency] = useState<Currency>("EUR");
  const [expenseAmount, setExpenseAmount] = useState("0.00");
  const [expenseDescription, setExpenseDescription] = useState("");

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      title="New Expense"
      size="md"
    >
      <View style={styles.content}>
        <UIInputExpense
          currency={expenseCurrency}
          amount={expenseAmount}
          onCurrencyChange={setExpenseCurrency}
          onAmountChange={setExpenseAmount}
        />
        <UIInputText
          placeholder="Enter URL"
          value={expenseDescription}
          onChange={setExpenseDescription}
          autoFocus
        />
      </View>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: gaps.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: getColor(colors.whiteGrey),
    borderRadius: borderRadiuses.sm,
    padding: gaps.sm,
    fontSize: 16,
    color: getColor(colors.textDarkGrey),
  },
});
