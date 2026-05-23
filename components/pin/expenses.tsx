import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Wallet as WalletIcon } from "lucide-react-native";

import { CardExpenseRegular } from "@/components/card/expense/regular";
import { ConfirmActionDialog } from "@/components/dialog/confirm-action";
import { colors, getColor } from "@/constants/theme";
import {
  actionListLocalExpensesByPin,
  actionSoftDeleteLocalExpense,
} from "@/lib/sqlite/model/expense";
import { type Pin } from "@/types/pin";
import { PinSectionTemplate, pinSectionStyles } from "./section-template";

type PinExpensesProps = {
  pinId: string;
  tripId: string;
  userId: string;
  onAddExpense: () => void;
};

export const PinExpenses = ({
  pinId,
  tripId,
  userId,
  onAddExpense,
}: PinExpensesProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const queryClient = useQueryClient();

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

  const softDeleteExpenseMutation = useMutation({
    mutationFn: (expenseId: string) => actionSoftDeleteLocalExpense(expenseId, userId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["local-pin-expenses", pinId, userId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["local-trip-expenses", tripId, userId],
        }),
      ]);
      setIsDeleteDialogOpen(false);
      setSelectedExpenseId(null);
    },
  });

  return (
    <>
      <PinSectionTemplate
        title="Expenses"
        icon={<WalletIcon size={24} color={getColor(colors.purple)} />}
        onAdd={onAddExpense}
        addText="Add Expense"
      >
        {expenses.map((expense, index) => (
          <View key={expense.id}>
            <CardExpenseRegular
              expense={expense}
              onPress={() => {}}
              onDeletePress={() => {
                setSelectedExpenseId(expense.id);
                setIsDeleteDialogOpen(true);
              }}
            />
            {index < expenses.length - 1 && (
              <View style={pinSectionStyles.divider} />
            )}
          </View>
        ))}
      </PinSectionTemplate>

      <ConfirmActionDialog
        visible={isDeleteDialogOpen}
        title="Delete Expense"
        message="Are you sure you want to delete this expense?"
        confirmText="Delete"
        onDismiss={() => {
          setIsDeleteDialogOpen(false);
          setSelectedExpenseId(null);
        }}
        onConfirm={() => {
          if (!selectedExpenseId) {
            return;
          }

          softDeleteExpenseMutation.mutate(selectedExpenseId);
        }}
        isPending={softDeleteExpenseMutation.isPending}
        confirmVariant="danger"
      />
    </>
  );
};
