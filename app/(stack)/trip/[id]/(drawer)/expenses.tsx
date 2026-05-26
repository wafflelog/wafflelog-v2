import { ButtonFab } from "@/components/button/fab";
import { CardExpenseRegular } from "@/components/card/expense/regular";
import { DialogNewExpense } from "@/components/dialog/new-expense";
import { TripExpenseSummary } from "@/components/trip/expense-summary";
import { UITab } from "@/components/ui/tab";
import { UIText } from "@/components/ui/text";
import { gaps, getCardBasicStyle } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
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

  const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const youPaid = filteredExpenses.reduce((sum, expense) => {
    return expense.paidByUserId === session?.user.id ? sum + expense.amount : sum;
  }, 0);
  const youAreOwed = 0;

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
            youPaid={youPaid}
            youAreOwed={youAreOwed}
          />
        </View>

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
                  amount: item.amount,
                  currency: item.currency as Currency,
                  paidBy: {
                    id: item.paidByUserId,
                    fullname: item.paidByName,
                  },
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
  checklist: {
    gap: gaps.md,
  },
  emptyState: {
    ...getCardBasicStyle("sm"),
    alignItems: "center",
  },
});
