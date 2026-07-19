import { ButtonFab } from "@/components/button/fab";
import { CardExpenseRegular } from "@/components/card/expense/regular";
import { DialogNewExpense } from "@/components/dialog/new-expense";
import { TitleRegular } from "@/components/title/regular";
import { TripExpenseSummary } from "@/components/trip/expense-summary";
import { UITab } from "@/components/ui/tab";
import { UIText } from "@/components/ui/text";
import { gaps, getCardBasicStyle } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import {
  calculateSharedExpenseLedger,
  getExpensePayerDisplayName,
} from "@/lib/helper/expense";
import { getPinTitle } from "@/lib/helper/pin";
import { actionListLocalExpensesByTrip } from "@/lib/sqlite/model/expense";
import { actionGetLocalTrip } from "@/lib/sqlite/model/trip";
import { type Currency } from "@/types/pin";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Plus as PlusIcon } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

export default function TripExpensesScreen() {
  const { id } = useLocalSearchParams();
  const { session } = useAuthSession();
  const { showMessage, SystemMessageModal } = useSystemMessage();

  const [activeCurrency, setActiveCurrency] = useState<Currency | null>(null);
  const [isDialogNewExpenseVisible, setIsDialogNewExpenseVisible] =
    useState(false);

  const { data: localTrip } = useQuery({
    queryKey: ["local-trip", String(id), session?.user.id],
    queryFn: () => actionGetLocalTrip(String(id), session!.user.id),
    enabled: Boolean(id && session?.user.id),
  });

  const { data: localExpenses = [] } = useQuery({
    queryKey: ["local-trip-expenses", String(id), session?.user.id],
    queryFn: () => actionListLocalExpensesByTrip(String(id), session!.user.id),
    enabled: Boolean(id && session?.user.id),
  });

  const trip = localTrip
    ? {
        id: localTrip.id,
        title: localTrip.title,
        startDate: localTrip.startDate,
        endDate: localTrip.endDate,
        location: "Unknown destination",
        companions: [],
        pins: [],
        checklistItems: [],
        referenceLinks: [],
        documents: [],
        images: [],
        expenses: [],
      }
    : null;

  const availableCurrencies = useMemo(() => {
    return Array.from(
      new Set(localExpenses.map((expense) => expense.currency as Currency)),
    );
  }, [localExpenses]);

  useEffect(() => {
    if (!activeCurrency && availableCurrencies.length > 0) {
      setActiveCurrency(availableCurrencies[0]);
    }
  }, [activeCurrency, availableCurrencies]);

  const filteredExpenses = activeCurrency
    ? localExpenses.filter((expense) => expense.currency === activeCurrency)
    : localExpenses;

  const ledgers = useMemo(
    () =>
      calculateSharedExpenseLedger(
        localExpenses.map((expense) => ({
          id: expense.id,
          currency: expense.currency,
          amount: expense.amount.toFixed(2),
          paidByUserId: expense.paidByUserId,
          participants: expense.participants.map((participant) => ({
            userId: participant.userId,
            splitAmount: participant.splitAmount,
          })),
        })),
      ),
    [localExpenses],
  );
  const activeLedger = ledgers.find(
    (ledger) => ledger.currency === activeCurrency,
  );
  const total = activeLedger
    ? activeLedger.balances
        .reduce((sum, balance) => sum + Number(balance.paid), 0)
        .toFixed(2)
    : "0.00";
  const currentUserBalance =
    activeLedger?.balances.find((balance) => balance.userId === session?.user.id)
      ?.net ?? "0.00";
  const currentUserPaid =
    activeLedger?.balances.find((balance) => balance.userId === session?.user.id)
      ?.paid ?? "0.00";
  const displayNameByUserId = localExpenses.reduce(
    (names, expense) => {
      names.set(
        expense.paidByUserId,
        expense.paidByUsername ?? expense.paidByName,
      );
      for (const participant of expense.participants) {
        if (participant.username) {
          names.set(participant.userId, participant.username);
        }
      }
      return names;
    },
    new Map<string, string>(),
  );
  const getUserDisplayName = (userId: string) =>
    userId === session?.user.id
      ? "You"
      : `@${displayNameByUserId.get(userId) ?? "unknown"}`;

  const tabs = availableCurrencies.map((currency) => ({
    id: currency,
    label: currency,
    isActive: activeCurrency === currency,
  }));

  if (!trip) {
    return <UIText>Trip not found</UIText>;
  }

  return (
    <View style={styles.container}>
      {tabs.length > 0 && (
        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <UITab
              key={tab.id}
              text={tab.label}
              onPress={() => setActiveCurrency(tab.id as Currency)}
              isActive={tab.isActive}
              variant="short"
            />
          ))}
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.summary}>
          <TripExpenseSummary
            currency={activeCurrency ?? "N/A"}
            total={total}
            youPaid={currentUserPaid}
            yourBalance={currentUserBalance}
          />
        </View>

        {activeLedger && (
          <View style={styles.ledger}>
            <TitleRegular size="sm" weight="600">
              Balances
            </TitleRegular>
            {activeLedger.balances.map((balance) => (
              <View key={balance.userId} style={styles.ledgerRow}>
                <UIText>{getUserDisplayName(balance.userId)}</UIText>
                <UIText>
                  {Number(balance.net) > 0
                    ? `is owed ${balance.net}`
                    : Number(balance.net) < 0
                      ? `owes ${balance.net.slice(1)}`
                      : "settled up"} {activeLedger.currency}
                </UIText>
              </View>
            ))}
            {activeLedger.settlements.length > 0 && (
              <>
                <TitleRegular size="sm" weight="600" style={styles.settlementTitle}>
                  Settle up
                </TitleRegular>
                {activeLedger.settlements.map((settlement) => (
                  <UIText
                    key={`${settlement.fromUserId}-${settlement.toUserId}`}
                  >
                    {getUserDisplayName(settlement.fromUserId)} pays{" "}
                    {getUserDisplayName(settlement.toUserId)} {settlement.amount}{" "}
                    {activeLedger.currency}
                  </UIText>
                ))}
              </>
            )}
          </View>
        )}

        <FlatList
          contentContainerStyle={styles.checklist}
          data={filteredExpenses}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <UIText>No expenses yet</UIText>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.expense}>
              <CardExpenseRegular
                expense={{
                  id: item.id,
                  description: item.description,
                  context: item.pin
                    ? `For ${getPinTitle(item.pin)}`
                    : undefined,
                  amount: item.amount,
                  currency: item.currency as Currency,
                  paidBy: {
                    id: item.paidByUserId,
                    fullname: getExpensePayerDisplayName({
                      ...item,
                      currentUserId: session!.user.id,
                    }),
                  },
                  participantNames: item.participants.map((participant) =>
                    participant.userId === session?.user.id
                      ? "You"
                      : `@${participant.username ?? "unknown"}`,
                  ),
                  creator: item.creator,
                }}
                onPress={() => {}}
              />
            </View>
          )}
        />
      </View>
      <ButtonFab
        onPress={() => {
          setIsDialogNewExpenseVisible(true);
        }}
        text="New Item"
        icon={(color) => <PlusIcon size={20} color={color} />}
      />
      <DialogNewExpense
        tripId={String(id)}
        visible={isDialogNewExpenseVisible}
        onDismiss={() => setIsDialogNewExpenseVisible(false)}
        onShowMessage={showMessage}
      />
      <SystemMessageModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    gap: gaps.md,
    backgroundColor: "white",
    padding: gaps.md,
    flexDirection: "row",
  },
  content: {
    flex: 1,
    gap: gaps.md,
    padding: gaps.md,
  },
  expense: {
    ...getCardBasicStyle("sm"),
  },
  summary: {},
  ledger: {
    ...getCardBasicStyle("sm"),
    gap: gaps.xs,
  },
  ledgerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: gaps.sm,
  },
  settlementTitle: {
    marginTop: gaps.xs,
  },
  checklist: {
    gap: gaps.md,
  },
  emptyState: {
    ...getCardBasicStyle("sm"),
    alignItems: "center",
  },
});
