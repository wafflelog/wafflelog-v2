import { useState } from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Wallet as WalletIcon } from "lucide-react-native";

import { CardExpenseRegular } from "@/components/card/expense/regular";
import { DialogNewExpense } from "@/components/dialog/new-expense";
import { colors, getColor } from "@/constants/theme";
import { actionListLocalExpensesByPin } from "@/lib/sqlite/model/expense";
import { type Pin } from "@/types/pin";
import { PinSectionTemplate, pinSectionStyles } from "./section-template";

type PinExpensesProps = {
  pinId: string;
  tripId: string;
  userId: string;
};

export const PinExpenses = ({
  pinId,
  tripId,
  userId,
}: PinExpensesProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: localExpenses = [] } = useQuery({
    queryKey: ["local-pin-expenses", pinId, userId],
    queryFn: () => actionListLocalExpensesByPin(pinId, userId),
    enabled: Boolean(pinId && userId),
  });

  const expenses: Pin["expenses"] = localExpenses.map((expense) => ({
    id: expense.id,
    description: expense.description,
    amount: expense.amount,
    currency: expense.currency as Pin["expenses"][number]["currency"],
    paidBy: {
      id: expense.paidByUserId,
      fullname: expense.paidByName,
    },
  }));

  return (
    <>
      <PinSectionTemplate
        title="Expenses"
        icon={<WalletIcon size={24} color={getColor(colors.purple)} />}
        onAdd={() => setIsDialogOpen(true)}
        addText="Add Expense"
      >
        {expenses.map((expense, index) => (
          <View key={expense.id}>
            <CardExpenseRegular expense={expense} onPress={() => {}} />
            {index < expenses.length - 1 && (
              <View style={pinSectionStyles.divider} />
            )}
          </View>
        ))}
      </PinSectionTemplate>

      <DialogNewExpense
        pinId={pinId}
        tripId={tripId}
        visible={isDialogOpen}
        onDismiss={() => setIsDialogOpen(false)}
      />
    </>
  );
};
