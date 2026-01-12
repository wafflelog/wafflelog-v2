import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UserScreen() {
  const router = useRouter();

  // Dummy data
  const userData = {
    name: "Mike Johnson",
    thumbnail: "M",
    isConnected: true,
    sharedTrips: {
      past: [
        {
          id: 1,
          name: "New York City",
          date: "Feb 20 - Feb 25, 2024",
          location: "New York, USA",
        },
        {
          id: 2,
          name: "London Adventure",
          date: "Jan 10 - Jan 18, 2024",
          location: "London, UK",
        },
      ],
      ongoing: [
        {
          id: 3,
          name: "Barcelona Getaway",
          date: "Mar 10 - Mar 17, 2024",
          location: "Barcelona, Spain",
        },
      ],
      future: [
        {
          id: 4,
          name: "Tokyo Adventure",
          date: "Mar 15 - Mar 22, 2024",
          location: "Tokyo, Japan",
        },
      ],
    },
    expenses: {
      theyOweMe: [
        {
          id: 1,
          description: "Hotel booking",
          amount: 120,
          currency: "EUR",
          trip: "Barcelona Getaway",
          date: "Mar 10, 2024",
        },
        {
          id: 2,
          description: "Dinner at restaurant",
          amount: 45,
          currency: "EUR",
          trip: "Barcelona Getaway",
          date: "Mar 11, 2024",
        },
      ],
      iOweThem: [
        {
          id: 3,
          description: "Train tickets",
          amount: 85,
          currency: "EUR",
          trip: "Barcelona Getaway",
          date: "Mar 12, 2024",
        },
        {
          id: 4,
          description: "Museum entrance",
          amount: 30,
          currency: "EUR",
          trip: "Barcelona Getaway",
          date: "Mar 11, 2024",
        },
      ],
    },
  };

  const totalTheyOweMe = userData.expenses.theyOweMe.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const totalIOweThem = userData.expenses.iOweThem.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const netBalance = totalTheyOweMe - totalIOweThem;

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
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userData.thumbnail}</Text>
            </View>
            {userData.isConnected && (
              <View style={styles.connectedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#4A90E2" />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{userData.name}</Text>
          <View style={styles.connectionStatus}>
            {userData.isConnected ? (
              <>
                <Ionicons name="checkmark-circle" size={16} color="#4A90E2" />
                <Text style={styles.connectionText}>Connected</Text>
              </>
            ) : (
              <>
                <Ionicons name="person-add-outline" size={16} color="#666" />
                <Text style={styles.connectionText}>Not Connected</Text>
              </>
            )}
          </View>
        </View>

        {/* Expense Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Summary</Text>
          <View style={styles.expenseSummaryCard}>
            <View style={styles.expenseSummaryRow}>
              <View style={styles.expenseSummaryItem}>
                <Text style={styles.expenseSummaryLabel}>They Owe You</Text>
                <Text style={styles.expenseSummaryAmountPositive}>
                  {totalTheyOweMe} {userData.expenses.theyOweMe[0]?.currency}
                </Text>
              </View>
              <View style={styles.expenseSummaryDivider} />
              <View style={styles.expenseSummaryItem}>
                <Text style={styles.expenseSummaryLabel}>You Owe Them</Text>
                <Text style={styles.expenseSummaryAmountNegative}>
                  {totalIOweThem} {userData.expenses.iOweThem[0]?.currency}
                </Text>
              </View>
            </View>
            <View style={styles.netBalanceContainer}>
              <Text style={styles.netBalanceLabel}>Net Balance</Text>
              <Text
                style={[
                  styles.netBalanceAmount,
                  netBalance >= 0
                    ? styles.netBalancePositive
                    : styles.netBalanceNegative,
                ]}
              >
                {netBalance >= 0 ? "+" : ""}
                {netBalance} {userData.expenses.theyOweMe[0]?.currency}
              </Text>
            </View>
          </View>
        </View>

        {/* They Owe Me */}
        {userData.expenses.theyOweMe.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="arrow-down-circle" size={20} color="#4A90E2" />
              <Text style={styles.sectionTitle}>They Owe You</Text>
              <Text style={styles.expenseCount}>
                {userData.expenses.theyOweMe.length} items
              </Text>
            </View>
            <View style={styles.expensesList}>
              {userData.expenses.theyOweMe.map((expense) => (
                <View key={expense.id} style={styles.expenseItem}>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseDescription}>
                      {expense.description}
                    </Text>
                    <View style={styles.expenseMeta}>
                      <Text style={styles.expenseTrip}>{expense.trip}</Text>
                      <Text style={styles.expenseDate}> • {expense.date}</Text>
                    </View>
                  </View>
                  <Text style={styles.expenseAmountPositive}>
                    +{expense.amount} {expense.currency}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* I Owe Them */}
        {userData.expenses.iOweThem.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="arrow-up-circle" size={20} color="#FF6B6B" />
              <Text style={styles.sectionTitle}>You Owe Them</Text>
              <Text style={styles.expenseCount}>
                {userData.expenses.iOweThem.length} items
              </Text>
            </View>
            <View style={styles.expensesList}>
              {userData.expenses.iOweThem.map((expense) => (
                <View key={expense.id} style={styles.expenseItem}>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseDescription}>
                      {expense.description}
                    </Text>
                    <View style={styles.expenseMeta}>
                      <Text style={styles.expenseTrip}>{expense.trip}</Text>
                      <Text style={styles.expenseDate}> • {expense.date}</Text>
                    </View>
                  </View>
                  <Text style={styles.expenseAmountNegative}>
                    -{expense.amount} {expense.currency}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Shared Trips - Ongoing */}
        {userData.sharedTrips.ongoing.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="radio-button-on" size={20} color="#4A90E2" />
              <Text style={styles.sectionTitle}>Ongoing Trips</Text>
            </View>
            {userData.sharedTrips.ongoing.map((trip) => (
              <TouchableOpacity
                key={trip.id}
                style={styles.tripCard}
                onPress={() => router.push("/trip")}
              >
                <View style={styles.tripImagePlaceholder}>
                  <Ionicons name="image-outline" size={40} color="#999" />
                </View>
                <View style={styles.tripInfo}>
                  <Text style={styles.tripTitle}>{trip.name}</Text>
                  <View style={styles.tripMeta}>
                    <Ionicons name="calendar-outline" size={14} color="#666" />
                    <Text style={styles.tripDate}>{trip.date}</Text>
                  </View>
                  <View style={styles.tripMeta}>
                    <Ionicons name="location-outline" size={14} color="#666" />
                    <Text style={styles.tripLocation}>{trip.location}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Shared Trips - Future */}
        {userData.sharedTrips.future.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color="#4A90E2" />
              <Text style={styles.sectionTitle}>Upcoming Trips</Text>
            </View>
            {userData.sharedTrips.future.map((trip) => (
              <TouchableOpacity
                key={trip.id}
                style={styles.tripCard}
                onPress={() => router.push("/trip")}
              >
                <View style={styles.tripImagePlaceholder}>
                  <Ionicons name="image-outline" size={40} color="#999" />
                </View>
                <View style={styles.tripInfo}>
                  <Text style={styles.tripTitle}>{trip.name}</Text>
                  <View style={styles.tripMeta}>
                    <Ionicons name="calendar-outline" size={14} color="#666" />
                    <Text style={styles.tripDate}>{trip.date}</Text>
                  </View>
                  <View style={styles.tripMeta}>
                    <Ionicons name="location-outline" size={14} color="#666" />
                    <Text style={styles.tripLocation}>{trip.location}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Shared Trips - Past */}
        {userData.sharedTrips.past.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#666"
              />
              <Text style={styles.sectionTitle}>Past Trips</Text>
            </View>
            {userData.sharedTrips.past.map((trip) => (
              <TouchableOpacity
                key={trip.id}
                style={styles.tripCard}
                onPress={() => router.push("/trip")}
              >
                <View style={styles.tripImagePlaceholder}>
                  <Ionicons name="image-outline" size={40} color="#999" />
                </View>
                <View style={styles.tripInfo}>
                  <Text style={styles.tripTitle}>{trip.name}</Text>
                  <View style={styles.tripMeta}>
                    <Ionicons name="calendar-outline" size={14} color="#666" />
                    <Text style={styles.tripDate}>{trip.date}</Text>
                  </View>
                  <View style={styles.tripMeta}>
                    <Ionicons name="location-outline" size={14} color="#666" />
                    <Text style={styles.tripLocation}>{trip.location}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  moreButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
  },
  connectedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  connectionText: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  expenseSummaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expenseSummaryRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  expenseSummaryItem: {
    flex: 1,
    alignItems: "center",
  },
  expenseSummaryLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  expenseSummaryAmountPositive: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4A90E2",
  },
  expenseSummaryAmountNegative: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  expenseSummaryDivider: {
    width: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 16,
  },
  netBalanceContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    alignItems: "center",
  },
  netBalanceLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  netBalanceAmount: {
    fontSize: 24,
    fontWeight: "bold",
  },
  netBalancePositive: {
    color: "#4A90E2",
  },
  netBalanceNegative: {
    color: "#FF6B6B",
  },
  expenseCount: {
    fontSize: 14,
    color: "#666",
  },
  expensesList: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  expenseMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  expenseTrip: {
    fontSize: 12,
    color: "#999",
  },
  expenseDate: {
    fontSize: 12,
    color: "#999",
  },
  expenseAmountPositive: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A90E2",
  },
  expenseAmountNegative: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B6B",
  },
  tripCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  tripInfo: {
    flex: 1,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  tripMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  tripDate: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  tripLocation: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  bottomSpacing: {
    height: 24,
  },
});
