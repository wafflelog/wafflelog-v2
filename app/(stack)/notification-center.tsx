import { TitleRegular } from "@/components/title/regular";
import { borderRadiuses, colors, gaps, getColor } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PrototypeNotification = {
  id: string;
  type: "trip_invitation" | "accepted" | "declined" | "removed" | "left";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  status?: "pending" | "accepted" | "declined";
};

const prototypeNotifications: PrototypeNotification[] = [
  {
    id: "1",
    type: "trip_invitation",
    title: "Trip invitation",
    message: "amelia_roams invited you to co-edit Barcelona Getaway.",
    timestamp: "12 min ago",
    read: false,
    status: "pending",
  },
  {
    id: "2",
    type: "accepted",
    title: "Invite accepted",
    message: "maya.miles joined Tokyo Snack Map as a companion.",
    timestamp: "2 hours ago",
    read: false,
  },
  {
    id: "3",
    type: "declined",
    title: "Invite declined",
    message: "sam_weekends declined your Lisbon Long Weekend invite.",
    timestamp: "Yesterday",
    read: true,
  },
  {
    id: "4",
    type: "left",
    title: "Companion left",
    message: "ivy.in.transit left Barcelona Getaway. Their content is still visible.",
    timestamp: "2 days ago",
    read: true,
  },
  {
    id: "5",
    type: "removed",
    title: "Companion removed",
    message: "You removed noah.food.maps from Paris Notes.",
    timestamp: "Last week",
    read: true,
  },
];

export default function NotificationCenterScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(prototypeNotifications);

  const getNotificationIcon = (type: PrototypeNotification["type"]) => {
    switch (type) {
      case "trip_invitation":
        return "person-add";
      case "accepted":
        return "checkmark-circle";
      case "declined":
        return "close-circle";
      case "removed":
        return "person-remove";
      case "left":
        return "exit-outline";
      default:
        return "notifications";
    }
  };

  const updateInvitation = (
    notificationId: string,
    status: NonNullable<PrototypeNotification["status"]>,
  ) => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              read: true,
              status,
              title: status === "accepted" ? "Invite accepted" : "Invite declined",
              message:
                status === "accepted"
                  ? "You joined Barcelona Getaway as a companion."
                  : "You declined the Barcelona Getaway invite.",
            }
          : notification,
      ),
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
            <View
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

                {notification.status === "pending" ? (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => {
                        updateInvitation(notification.id, "accepted");
                      }}
                    >
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.declineButton]}
                      onPress={() => {
                        updateInvitation(notification.id, "declined");
                      }}
                    >
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
              {!notification.read && <View style={styles.unreadDot} />}
            </View>
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
    borderRadius: borderRadiuses.md,
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
  actionRow: {
    flexDirection: "row",
    gap: gaps.sm,
    marginTop: gaps.sm,
  },
  actionButton: {
    minWidth: 92,
    borderRadius: borderRadiuses.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: gaps.md,
    paddingVertical: gaps.xs,
  },
  acceptButton: {
    backgroundColor: getColor(colors.turquoise),
  },
  declineButton: {
    backgroundColor: getColor(colors.whiteGrey, 0.6),
  },
  acceptButtonText: {
    color: getColor(colors.white),
    fontSize: 13,
    fontWeight: "700",
  },
  declineButtonText: {
    color: getColor(colors.textDarkGrey),
    fontSize: 13,
    fontWeight: "700",
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
