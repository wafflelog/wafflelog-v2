import { TitleRegular } from "@/components/title/regular";
import { Dialog } from "@/components/ui/dialog";
import { UIInputExpense } from "@/components/ui/input/expense";
import { UIInputSelect } from "@/components/ui/input/select";
import { UIInputText } from "@/components/ui/input/text";
import { borderRadiuses, colors, gaps, getColor } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { type SystemMessageType } from "@/hook/use-system-message";
import { splitExpenseEqually } from "@/lib/helper/expense";
import {
  actionCreateLocalExpense,
  actionListLocalExpenseSplitParticipants,
} from "@/lib/sqlite/model/expense";
import { Currency } from "@/types/pin";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckSquare, Square } from "lucide-react-native";
import { type ReactNode, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
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
  visible,
  ...props
}: DialogNewExpenseProps) => {
  return <DialogNewExpenseVisible {...props} visible={visible} />;
};

const DialogNewExpenseVisible = ({
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
  const [paidByUserIdOverride, setPaidByUserIdOverride] = useState<
    string | null | undefined
  >(undefined);
  const [participantUserIdsOverride, setParticipantUserIdsOverride] = useState<
    string[] | null
  >(null);

  const { data: splitParticipants = [] } = useQuery({
    queryKey: ["local-expense-split-participants", tripId],
    queryFn: () => actionListLocalExpenseSplitParticipants(tripId!),
    enabled: Boolean(visible && tripId),
  });

  const participantUserIds =
    participantUserIdsOverride ??
    splitParticipants.map((participant) => participant.userId);
  const defaultPaidByUserId = splitParticipants.some(
    (participant) => participant.userId === session?.user.id,
  )
    ? (session?.user.id ?? null)
    : (splitParticipants[0]?.userId ?? null);
  const paidByUserId = paidByUserIdOverride ?? defaultPaidByUserId;

  const resetForm = () => {
    setExpenseCurrency("EUR");
    setExpenseAmount("");
    setExpenseDescription("");
    setPaidByUserIdOverride(undefined);
    setParticipantUserIdsOverride(null);
  };

  const handleDismiss = () => {
    resetForm();
    onDismiss();
  };

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

      handleDismiss();
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

    if (participantUserIds.length === 0) {
      onShowMessage("Select at least one person to split this expense", "error");
      return;
    }

    if (!paidByUserId) {
      onShowMessage("Select who paid for this expense", "error");
      return;
    }

    const allocations = splitExpenseEqually(
      result.data.expenseAmount,
      participantUserIds,
    );
    const payer = splitParticipants.find(
      (participant) => participant.userId === paidByUserId,
    );

    createExpenseMutation.mutate({
      pinId: pinId ?? null,
      tripId,
      userId: session.user.id,
      description: result.data.expenseDescription,
      amount: Number(result.data.expenseAmount),
      currency: result.data.expenseCurrency,
      paidByUserId,
      paidByName: payer?.username ?? "Unknown payer",
      participants: allocations,
    });
  };

  const toggleParticipant = (userId: string) => {
    setParticipantUserIdsOverride(
      participantUserIds.includes(userId)
        ? participantUserIds.filter((id) => id !== userId)
        : [...participantUserIds, userId],
    );
  };

  const allocations = (() => {
    if (!/^\d+(\.\d{1,2})?$/.test(expenseAmount.trim())) {
      return new Map<string, string>();
    }

    try {
      return new Map(
        splitExpenseEqually(expenseAmount.trim(), participantUserIds).map(
          (allocation) => [allocation.userId, allocation.splitAmount],
        ),
      );
    } catch {
      return new Map<string, string>();
    }
  })();

  return (
    <Dialog
      visible={visible}
      onDismiss={handleDismiss}
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
        <View style={styles.section}>
          <TitleRegular size="sm" weight="600">
            Paid by
          </TitleRegular>
          <UIInputSelect
            selectedValue={paidByUserId ?? undefined}
            placeholder="Select payer"
            options={splitParticipants.map((participant) => ({
              value: participant.userId,
              label:
                participant.userId === session?.user.id
                  ? "You"
                  : `@${participant.username ?? "unknown"}`,
            }))}
            onValueChange={setPaidByUserIdOverride}
          />
        </View>
        <View style={styles.section}>
          <View style={styles.splitHeading}>
            <TitleRegular size="sm" weight="600">
              Split between
            </TitleRegular>
            <TitleRegular size="xs" color={colors.textLightGrey}>
              Equal split
            </TitleRegular>
          </View>
          {splitParticipants.map((participant) => {
            const selected = participantUserIds.includes(participant.userId);
            const displayName =
              participant.userId === session?.user.id
                ? "You"
                : `@${participant.username ?? "unknown"}`;

            return (
              <TouchableOpacity
                key={participant.userId}
                style={[styles.participant, selected && styles.participantSelected]}
                onPress={() => toggleParticipant(participant.userId)}
              >
                {selected ? (
                  <CheckSquare size={20} color={getColor(colors.pineGreen)} />
                ) : (
                  <Square size={20} color={getColor(colors.textLightGrey)} />
                )}
                <TitleRegular size="sm" style={styles.participantName}>
                  {displayName}
                </TitleRegular>
                {selected && allocations.get(participant.userId) ? (
                  <TitleRegular size="sm" weight="600">
                    {allocations.get(participant.userId)} {expenseCurrency}
                  </TitleRegular>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: gaps.sm,
  },
  section: {
    gap: gaps.xs,
  },
  splitHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  participant: {
    alignItems: "center",
    borderColor: getColor(colors.whiteGrey),
    borderRadius: borderRadiuses.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: gaps.sm,
    padding: gaps.sm,
  },
  participantSelected: {
    backgroundColor: getColor(colors.pineGreen, 0.08),
    borderColor: getColor(colors.pineGreen, 0.35),
  },
  participantName: {
    flex: 1,
  },
});
