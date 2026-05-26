import { Dialog } from "@/components/ui/dialog";
import { UIInputExpense } from "@/components/ui/input/expense";
import { UIInputText } from "@/components/ui/input/text";
import { gaps } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { type SystemMessageType } from "@/hook/use-system-message";
import { actionCreateLocalExpense } from "@/lib/sqlite/model/expense";
import { Currency } from "@/types/pin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { StyleSheet, View } from "react-native";
import { newExpenseFormSchema } from "./new-expense/schema";

type DialogNewExpenseProps = {
  pinId?: string;
  tripId?: string;
  visible: boolean;
  onDismiss: () => void;
  onShowMessage: (message: string, type?: SystemMessageType) => void;
  systemMessageOverlay?: ReactNode;
};

export const DialogNewExpense = ({
  pinId,
  tripId,
  visible,
  onDismiss,
  onShowMessage,
  systemMessageOverlay,
}: DialogNewExpenseProps) => {
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const [expenseCurrency, setExpenseCurrency] = useState<Currency>("EUR");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");

  const createExpenseMutation = useMutation({
    mutationFn: actionCreateLocalExpense,
    onSuccess: async () => {
      if (session?.user.id) {
        const invalidations = [
          queryClient.invalidateQueries({
            queryKey: ["local-trip-expenses", tripId, session.user.id],
          }),
        ];

        if (pinId) {
          invalidations.push(
            queryClient.invalidateQueries({
              queryKey: ["local-pin-expenses", pinId, session.user.id],
            }),
          );
        }

        await Promise.all(invalidations);
      }

      setExpenseCurrency("EUR");
      setExpenseAmount("");
      setExpenseDescription("");
      onDismiss();
      onShowMessage("Expense saved locally", "info");
    },
    onError: (error) => {
      console.error("Error creating expense:", error);
      const message =
        error instanceof Error ? error.message : "Failed to save expense";
      onShowMessage(message, "error");
    },
  });

  const handleConfirm = () => {
    if (!session?.user.id) {
      onShowMessage("You must be signed in to create an expense", "error");
      return;
    }

    if (!tripId) {
      onShowMessage("This expense needs to be attached to a trip", "error");
      return;
    }

    const result = newExpenseFormSchema.safeParse({
      expenseDescription,
      expenseAmount,
      expenseCurrency,
    });

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        "Check your expense details and try again.";
      onShowMessage(message, "error");
      return;
    }

    createExpenseMutation.mutate({
      pinId: pinId ?? null,
      tripId,
      userId: session.user.id,
      description: result.data.expenseDescription,
      amount: Number(result.data.expenseAmount),
      currency: result.data.expenseCurrency,
      paidByUserId: session.user.id,
      paidByName: "You",
    });
  };

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      title="New Expense"
      size="md"
      onConfirm={handleConfirm}
      overlay={systemMessageOverlay}
    >
      <View style={styles.content}>
        <UIInputExpense
          currency={expenseCurrency}
          amount={expenseAmount}
          onCurrencyChange={setExpenseCurrency}
          onAmountChange={setExpenseAmount}
        />
        <UIInputText
          placeholder="Enter expense description"
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
});
