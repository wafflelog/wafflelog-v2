import { CardTrip } from "@/components/card/trip";
import { TRIPS } from "@/data";
import { Ionicons } from "@expo/vector-icons";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function IndexScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>Good morning!</Text>
            <Text style={styles.userName}>Sarah</Text>
            <View style={styles.headerMeta}>
              <View style={styles.headerMetaItem}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text style={styles.headerMetaText}>
                  Monday, March 13, 2024
                </Text>
              </View>
              <View style={styles.headerMetaItem}>
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text style={styles.headerMetaText}>Barcelona, Spain</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle-outline" size={32} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={[styles.actionCard, styles.primaryAction]}>
              <Ionicons name="add-circle" size={22} color="#fff" />
              <Text style={styles.primaryActionText}>New Trip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="map-outline" size={22} color="#4A90E2" />
              <Text style={styles.actionText}>Explore</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="bookmark-outline" size={22} color="#4A90E2" />
              <Text style={styles.actionText}>Saved</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ongoing Trip */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ongoing Trip</Text>

          <CardTrip trip={TRIPS[0]} variant="hero" />
        </View>

        {/* Upcoming Trips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Trips</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {TRIPS.map((trip) => (
            <CardTrip
              key={trip.id}
              trip={trip}
              variant="regular"
              color="turquoise"
            />
          ))}
        </View>

        {/* Past Trips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Past Trips</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {TRIPS.map((trip) => (
            <CardTrip
              key={trip.id}
              trip={trip}
              variant="regular"
              color="purple"
            />
          ))}
        </View>

        {/* Stats Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Travel Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>Countries</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>45</Text>
              <Text style={styles.statLabel}>Cities</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  headerMeta: {
    gap: 8,
  },
  headerMetaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerMetaText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 6,
  },
  profileButton: {
    padding: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: "#4A90E2",
    fontWeight: "600",
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryAction: {
    backgroundColor: "#4A90E2",
  },
  actionText: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "600",
    color: "#4A90E2",
  },
  primaryActionText: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
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
  friendsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  friendAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  friendAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  friendAvatarOverlap: {
    marginLeft: -8,
  },
  friendAvatarText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  friendsCount: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
  ongoingTripCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: "#4A90E2",
  },
  ongoingTripImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  ongoingTripInfo: {
    flex: 1,
  },
  ongoingTripBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  ongoingTripBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4A90E2",
    marginLeft: 4,
  },
  ongoingTripTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  ongoingTripMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  ongoingTripDate: {
    fontSize: 15,
    color: "#666",
    marginLeft: 8,
  },
  ongoingTripLocation: {
    fontSize: 15,
    color: "#666",
    marginLeft: 8,
  },
  ongoingTripProgress: {
    marginTop: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    width: "43%",
    backgroundColor: "#4A90E2",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4A90E2",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
});
