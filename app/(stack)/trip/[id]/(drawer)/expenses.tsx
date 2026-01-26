import { CardExpenseRegular } from "@/components/card/expense/regular";
import { HeaderTrip } from "@/components/header/trip";
import { TripExpenseSummary } from "@/components/trip/expense-summary";
import { UITab } from "@/components/ui/tab";
import { UIText } from "@/components/ui/text";
import { gaps, getCardBasicStyle } from "@/constants/theme";
import { TRIPS } from "@/data";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Currency = "USD" | "EUR";

export default function TripExpensesScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();

  const [activeCurrency, setActiveCurrency] = useState<Currency>("USD");

  const trip = TRIPS.find((trip) => trip.id === id);

  if (!trip) {
    return <UIText>Trip not found</UIText>;
  }

  const tabs = ["USD", "EUR"].map((currency) => ({
    id: currency,
    label: currency,
    isActive: activeCurrency === currency,
  }));

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <HeaderTrip
        trip={trip}
        onBackPress={() => router.back()}
        onMorePress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      />
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

      <View style={styles.content}>
        <View style={styles.summary}>
          <TripExpenseSummary />
        </View>

        <FlatList
          contentContainerStyle={styles.checklist}
          data={trip.expenses}
          renderItem={({ item }) => (
            <View style={styles.expense}>
              <CardExpenseRegular expense={item} onPress={() => {}} />
            </View>
          )}
        />
      </View>
    </SafeAreaView>
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
});
