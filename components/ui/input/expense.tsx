import { gaps } from "@/constants/theme";
import { CURRENCIES, Currency } from "@/types/pin";
import { StyleSheet, View } from "react-native";
import { UIInputSelect } from "./select";
import { UIInputText } from "./text";

type UIInputExpenseProps = {
  currency: Currency;
  amount: string;
  onCurrencyChange: (currency: Currency) => void;
  onAmountChange: (amount: string) => void;
};

export const UIInputExpense = ({
  currency,
  amount,
  onCurrencyChange,
  onAmountChange,
}: UIInputExpenseProps) => {
  return (
    <View style={styles.container}>
      <UIInputSelect
        selectedValue={currency}
        options={CURRENCIES.map((currency) => ({
          label: currency,
          value: currency,
        }))}
        onValueChange={(value) => {
          onCurrencyChange(value as Currency);
        }}
        placeholder="Select currency"
      />
      <UIInputText
        containerStyle={styles.amount}
        placeholder="Enter amount"
        value={amount}
        onChange={(text) => {
          onAmountChange(text);
        }}
        keyboardType="decimal-pad"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
  },
  amount: {
    flex: 1,
  },
});
