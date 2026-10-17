import { ButtonFab } from "@/components/button/fab";
import { CardExpenseRegular } from "@/components/card/expense/regular";
import { DialogNewExpense } from "@/components/dialog/new-expense";
import { TripExpenseSummary } from "@/components/trip/expense-summary";
import { MemberExpenseGroup } from "@/components/trip/member-expense-group";
import { UITab } from "@/components/ui/tab";
import { UIText } from "@/components/ui/text";
import {
  colors,
  gaps,
  getCardBasicStyle,
  getColor,
  semanticColors,
} from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useKnownTripsRefresh } from "@/hook/use-known-trips-refresh";
import { useSystemMessage } from "@/hook/use-system-message";
import {
  calculatePersonalExpenseLedger,
  getExpensePayerDisplayName,
} from "@/lib/helper/expense";
import { getPinTitle } from "@/lib/helper/pin";
import { getUserDisplayName } from "@/lib/helper/user-display";
import { actionListLocalExpensesByTrip } from "@/lib/sqlite/model/expense";
import { actionGetLocalTrip } from "@/lib/sqlite/model/trip";
import { type Currency } from "@/types/pin";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Plus as PlusIcon } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

export default function TripExpensesScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { session } = useAuthSession();
  const currentUserId = session?.user.id;
  const { isRefreshing, refreshKnownTrips } = useKnownTripsRefresh();
  const { showMessage, SystemMessageModal } = useSystemMessage();

  const [activeCurrency, setActiveCurrency] = useState<Currency | null>(null);
  const [activeView, setActiveView] = useState<"balances" | "expenses">(
    "balances",
  );
  const [isDialogNewExpenseVisible, setIsDialogNewExpenseVisible] =
    useState(false);

  const { data: localTrip } = useQuery({
    queryKey: ["local-trip", String(tripId), session?.user.id],
    queryFn: () => actionGetLocalTrip(String(tripId), session!.user.id),
    enabled: Boolean(tripId && session?.user.id),
  });

  const { data: localExpenses = [] } = useQuery({
    queryKey: ["local-trip-expenses", String(tripId), session?.user.id],
    queryFn: () =>
      actionListLocalExpensesByTrip(String(tripId), session!.user.id),
    enabled: Boolean(tripId && session?.user.id),
  });

  const trip = localTrip
    ? {
        id: localTrip.id,
        title: localTrip.title,
        startDate: localTrip.startDate,
        endDate: localTrip.endDate,
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

  const selectedCurrency =
    activeCurrency && availableCurrencies.includes(activeCurrency)
      ? activeCurrency
      : (availableCurrencies[0] ?? null);

  const filteredExpenses = selectedCurrency
    ? localExpenses.filter((expense) => expense.currency === selectedCurrency)
    : localExpenses;

  const personalLedgers = useMemo(
    () => {
      if (!currentUserId) {
        return [];
      }

      return calculatePersonalExpenseLedger(
        localExpenses.map((expense) => ({
          id: expense.id,
          description: expense.description,
          context: expense.pin ? `For ${getPinTitle(expense.pin)}` : undefined,
          currency: expense.currency,
          amount: expense.amount.toFixed(2),
          paidByUserId: expense.paidByUserId,
          participants: expense.participants.map((participant) => ({
            userId: participant.userId,
            splitAmount: participant.splitAmount,
          })),
        })),
        currentUserId,
      );
    },
    [currentUserId, localExpenses],
  );
  const activeLedger = personalLedgers.find(
    (ledger) => ledger.currency === selectedCurrency,
  );
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
  const getTripUserDisplayName = (userId: string) =>
    getUserDisplayName(
      { userId, username: displayNameByUserId.get(userId) },
      session?.user.id,
    );

  const tabs = availableCurrencies.map((currency) => ({
    id: currency,
    label: currency,
    isActive: selectedCurrency === currency,
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
        <View style={styles.viewTabs}>
          <UITab
            text="Your balances"
            onPress={() => setActiveView("balances")}
            isActive={activeView === "balances"}
            style={styles.viewTab}
          />
          <UITab
            text="All expenses"
            onPress={() => setActiveView("expenses")}
            isActive={activeView === "expenses"}
            style={styles.viewTab}
          />
        </View>

        {activeView === "balances" ? (
          <ScrollView
            alwaysBounceVertical
            contentContainerStyle={styles.balanceContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshKnownTrips}
                tintColor={getColor(colors.purple)}
                colors={[getColor(colors.purple)]}
              />
            }
          >
            {activeLedger ? (
              <>
                <TripExpenseSummary
                  currency={activeLedger.currency}
                  totalSpent={activeLedger.totalSpent}
                  youOwe={activeLedger.youOwe}
                  owedToYou={activeLedger.owedToYou}
                />
                {activeLedger.members.length > 0 ? (
                  <View style={styles.memberGroups}>
                    {activeLedger.members.map((member) => (
                      <MemberExpenseGroup
                        key={member.userId}
                        member={member}
                        displayName={getTripUserDisplayName(member.userId)}
                        currency={activeLedger.currency}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <UIText>No balances with other travellers yet</UIText>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyState}>
                <UIText>No expenses yet</UIText>
              </View>
            )}
          </ScrollView>
        ) : (
          <FlatList
            contentContainerStyle={styles.expenseList}
            data={filteredExpenses}
            keyExtractor={(item) => item.id}
            alwaysBounceVertical
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshKnownTrips}
                tintColor={getColor(colors.purple)}
                colors={[getColor(colors.purple)]}
              />
            }
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
                    participants: item.participants.map((participant) => ({
                      id: participant.userId,
                      fullname: getUserDisplayName(
                        participant,
                        session?.user.id,
                      ),
                      splitAmount: participant.splitAmount,
                    })),
                    creator: item.creator,
                  }}
                />
              </View>
            )}
          />
        )}
      </View>
      <ButtonFab
        onPress={() => {
          setIsDialogNewExpenseVisible(true);
        }}
        text="New Item"
        icon={(color) => <PlusIcon size={20} color={color} />}
      />
      <DialogNewExpense
        tripId={String(tripId)}
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
    backgroundColor: semanticColors.screen,
  },
  tabs: {
    gap: gaps.md,
    backgroundColor: semanticColors.surface,
    padding: gaps.md,
    flexDirection: "row",
  },
  content: {
    flex: 1,
    gap: gaps.md,
    padding: gaps.md,
  },
  viewTabs: {
    flexDirection: "row",
    gap: gaps.xs,
    padding: gaps.xxs,
    borderRadius: 12,
    backgroundColor: getColor(colors.whiteGrey, 0.35),
  },
  viewTab: {
    flex: 1,
  },
  balanceContent: {
    gap: gaps.md,
    paddingBottom: 88,
  },
  memberGroups: {
    gap: gaps.sm,
  },
  expense: {
    ...getCardBasicStyle("sm"),
  },
  expenseList: {
    gap: gaps.md,
    paddingBottom: 88,
  },
  emptyState: {
    ...getCardBasicStyle("sm"),
    alignItems: "center",
  },
});
