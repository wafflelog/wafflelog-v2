import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  pinId: string;
  pinName: string;
}

const CURRENT_USER = "Sarah"; // Current logged-in user

export default function ExpensesScreen() {
  const router = useRouter();

  // Dummy data - expenses from all pins in the trip (with multiple currencies)
  const [expenses] = useState<Expense[]>([
    {
      id: "1",
      description: "Entrance Ticket",
      amount: 26,
      currency: "EUR",
      paidBy: "Sarah",
      pinId: "1",
      pinName: "Sagrada Família",
    },
    {
      id: "2",
      description: "Audio Guide",
      amount: 7,
      currency: "EUR",
      paidBy: "Mike",
      pinId: "1",
      pinName: "Sagrada Família",
    },
    {
      id: "3",
      description: "Taxi to location",
      amount: 12,
      currency: "EUR",
      paidBy: "Jessica",
      pinId: "1",
      pinName: "Sagrada Família",
    },
    {
      id: "4",
      description: "Park entrance fee",
      amount: 10,
      currency: "EUR",
      paidBy: "Sarah",
      pinId: "2",
      pinName: "Park Güell",
    },
    {
      id: "5",
      description: "Lunch at market",
      amount: 35,
      currency: "EUR",
      paidBy: "David",
      pinId: "3",
      pinName: "La Boqueria Market",
    },
    {
      id: "6",
      description: "Museum tickets",
      amount: 24,
      currency: "EUR",
      paidBy: "Sarah",
      pinId: "5",
      pinName: "Picasso Museum",
    },
    {
      id: "7",
      description: "Beach umbrella rental",
      amount: 15,
      currency: "EUR",
      paidBy: "Mike",
      pinId: "6",
      pinName: "Barceloneta Beach",
    },
    {
      id: "8",
      description: "Cable car tickets",
      amount: 18,
      currency: "EUR",
      paidBy: "Sarah",
      pinId: "7",
      pinName: "Montjuïc Hill",
    },
    {
      id: "9",
      description: "Dinner near fountain",
      amount: 45,
      currency: "EUR",
      paidBy: "Jessica",
      pinId: "8",
      pinName: "Magic Fountain",
    },
    {
      id: "10",
      description: "Hotel booking",
      amount: 120,
      currency: "USD",
      paidBy: "Sarah",
      pinId: "1",
      pinName: "Sagrada Família",
    },
    {
      id: "11",
      description: "Flight tickets",
      amount: 450,
      currency: "USD",
      paidBy: "Mike",
      pinId: "1",
      pinName: "Sagrada Família",
    },
    {
      id: "12",
      description: "Travel insurance",
      amount: 85,
      currency: "USD",
      paidBy: "David",
      pinId: "2",
      pinName: "Park Güell",
    },
  ]);

  // Group expenses by currency and calculate totals per currency
  const expensesByCurrency = expenses.reduce((acc, expense) => {
    if (!acc[expense.currency]) {
      acc[expense.currency] = [];
    }
    acc[expense.currency].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  const currencies = Object.keys(expensesByCurrency).sort();
  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    currencies[0] || ""
  );

  // Filter expenses by selected currency
  const filteredExpenses = expenses.filter(
    (expense) => expense.currency === selectedCurrency
  );

  // Calculate totals per currency
  const currencyTotals = currencies.map((currency) => {
    const currencyExpenses = expensesByCurrency[currency];
    const totalSpending = currencyExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const userPaid = currencyExpenses
      .filter((expense) => expense.paidBy === CURRENT_USER)
      .reduce((sum, expense) => sum + expense.amount, 0);
    const userOwed = currencyExpenses
      .filter((expense) => expense.paidBy !== CURRENT_USER)
      .reduce((sum, expense) => sum + expense.amount / 4, 0); // Assuming 4 people split expenses
    const netBalance = userPaid - userOwed;

    return {
      currency,
      totalSpending,
      userPaid,
      userOwed,
      netBalance,
    };
  });

  const handleExpensePress = (expense: Expense) => {
    router.push(`/pin?id=${expense.pinId}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Expenses</Text>
          <Text style={styles.headerSubtitle}>
            {expenses.length} {expenses.length === 1 ? "expense" : "expenses"}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {/* Currency Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {currencies.map((currency) => (
            <TouchableOpacity
              key={currency}
              style={[
                styles.tab,
                selectedCurrency === currency && styles.tabActive,
              ]}
              onPress={() => setSelectedCurrency(currency)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedCurrency === currency && styles.tabTextActive,
                ]}
              >
                {currency}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Expenses List */}
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.summarySection}>
            {(() => {
              const totals = currencyTotals.find(
                (t) => t.currency === selectedCurrency
              );
              if (!totals) return null;
              return (
                <View style={styles.summaryCard}>
                  <View style={styles.currencyHeader}>
                    <Text style={styles.currencyLabel}>{totals.currency}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Total Spending</Text>
                      <Text style={styles.summaryAmount}>
                        {totals.totalSpending.toFixed(2)} {totals.currency}
                      </Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>You Paid</Text>
                      <Text style={[styles.summaryAmount, styles.summaryPaid]}>
                        {totals.userPaid.toFixed(2)} {totals.currency}
                      </Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>You Owe</Text>
                      <Text
                        style={[
                          styles.summaryAmount,
                          totals.netBalance >= 0
                            ? styles.summaryOwed
                            : styles.summaryOwedNegative,
                        ]}
                      >
                        {totals.netBalance >= 0 ? "-" : ""}
                        {Math.abs(totals.netBalance).toFixed(2)}{" "}
                        {totals.currency}
                      </Text>
                    </View>
                  </View>
                  {totals.netBalance < 0 && (
                    <View style={styles.netBalanceBadge}>
                      <Ionicons name="arrow-down" size={14} color="#FF6B6B" />
                      <Text style={styles.netBalanceText}>
                        You owe {Math.abs(totals.netBalance).toFixed(2)}{" "}
                        {totals.currency}
                      </Text>
                    </View>
                  )}
                  {totals.netBalance > 0 && (
                    <View style={styles.netBalanceBadgePositive}>
                      <Ionicons name="arrow-up" size={14} color="#4A90E2" />
                      <Text style={styles.netBalanceTextPositive}>
                        You are owed {totals.netBalance.toFixed(2)}{" "}
                        {totals.currency}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })()}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.expenseItem}
            onPress={() => handleExpensePress(item)}
          >
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseDescription}>{item.description}</Text>
              <View style={styles.expenseMeta}>
                <View style={styles.pinBadge}>
                  <Ionicons name="location" size={12} color="#666" />
                  <Text style={styles.pinName}>{item.pinName}</Text>
                </View>
                <Text style={styles.expensePaidBy}>Paid by {item.paidBy}</Text>
              </View>
            </View>
            <View style={styles.expenseAmountContainer}>
              <Text style={styles.expenseAmount}>
                {item.amount} {item.currency}
              </Text>
              {item.paidBy === CURRENT_USER && (
                <View style={styles.paidByYouBadge}>
                  <Text style={styles.paidByYouText}>You</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cash-outline" size={64} color="#CCC" />
            <Text style={styles.emptyStateText}>No expenses yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add expenses from pin details
            </Text>
          </View>
        }
      />

      {/* Add Expense Button */}
      <View style={styles.addExpenseSection}>
        <TouchableOpacity style={styles.addExpenseButton}>
          <Ionicons name="add-circle-outline" size={20} color="#4A90E2" />
          <Text style={styles.addExpenseText}>Add Expense</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  addButton: {
    padding: 4,
  },
  tabsContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tabsContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F5F7FA",
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: "#E8F2FF",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  tabTextActive: {
    color: "#4A90E2",
    fontWeight: "600",
  },
  summarySection: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    gap: 16,
  },
  summaryCard: {
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    padding: 16,
  },
  currencyHeader: {
    marginBottom: 12,
  },
  currencyLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A90E2",
    textTransform: "uppercase",
  },
  currencyDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginTop: 16,
    marginBottom: -16,
    marginHorizontal: -16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E0E0E0",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  summaryPaid: {
    color: "#4A90E2",
  },
  summaryOwed: {
    color: "#FF9500",
  },
  summaryOwedNegative: {
    color: "#FF6B6B",
  },
  netBalanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFE5E5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  netBalanceBadgePositive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  netBalanceText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FF6B6B",
  },
  netBalanceTextPositive: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A90E2",
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
  },
  expenseMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  pinBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  pinName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  expensePaidBy: {
    fontSize: 12,
    color: "#999",
  },
  expenseAmountContainer: {
    alignItems: "flex-end",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  paidByYouBadge: {
    backgroundColor: "#E8F2FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paidByYouText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#4A90E2",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  addExpenseSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  addExpenseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    gap: 8,
  },
  addExpenseText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A90E2",
  },
});
