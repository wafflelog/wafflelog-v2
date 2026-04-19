import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor } from "@/constants/theme";
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

export default function NotificationCenterScreen() {
  const router = useRouter();

  // TODO: Replace with actual notifications data
  const notifications = [
    {
      id: "1",
      type: "trip_invitation",
      title: "Trip Invitation",
      message: "John Doe invited you to join Barcelona Getaway",
      timestamp: "2 hours ago",
      read: false,
    },
    {
      id: "2",
      type: "checklist_update",
      title: "Checklist Updated",
      message: "Mike Johnson completed 'Buy flight tickets'",
      timestamp: "5 hours ago",
      read: false,
    },
    {
      id: "3",
      type: "expense_added",
      title: "New Expense",
      message: "Jessica Chen added a new expense: Entrance Ticket",
      timestamp: "1 day ago",
      read: true,
    },
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "trip_invitation":
        return "person-add";
      case "checklist_update":
        return "checkmark-circle";
      case "expense_added":
        return "cash";
      default:
        return "notifications";
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={getColor(colors.textDarkGrey)}
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <TitleRegular size="lg" weight="600">
            Notifications
          </TitleRegular>
        </View>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color={getColor(colors.paleGrey)}
            />
            <Text style={styles.emptyStateTitle}>No notifications</Text>
            <Text style={styles.emptyStateText}>{"You're all caught up!"}</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                !notification.read && styles.notificationItemUnread,
              ]}
            >
              <View style={styles.notificationIconContainer}>
                <Ionicons
                  name={getNotificationIcon(notification.type) as any}
                  size={24}
                  color={getColor(colors.turquoise)}
                />
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>
                  {notification.title}
                </Text>
                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>
                <Text style={styles.notificationTimestamp}>
                  {notification.timestamp}
                </Text>
              </View>
              {!notification.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))
        )}
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
    paddingHorizontal: gaps.md,
    paddingVertical: gaps.md,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: getColor(colors.whiteGrey),
  },
  backButton: {
    padding: gaps.xs,
    width: 40,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: gaps.md,
  },
  notificationItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: gaps.md,
    marginBottom: gaps.md,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationItemUnread: {
    borderLeftWidth: 4,
    borderLeftColor: getColor(colors.turquoise),
  },
  notificationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: getColor(colors.turquoise, 0.1),
    alignItems: "center",
    justifyContent: "center",
    marginRight: gaps.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: getColor(colors.textDarkGrey),
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: getColor(colors.textLightGrey),
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTimestamp: {
    fontSize: 12,
    color: getColor(colors.paleGrey),
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: getColor(colors.turquoise),
    marginTop: gaps.xs,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: gaps.xl * 2,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: getColor(colors.textDarkGrey),
    marginTop: gaps.md,
    marginBottom: gaps.xs,
  },
  emptyStateText: {
    fontSize: 14,
    color: getColor(colors.textLightGrey),
    textAlign: "center",
  },
});
