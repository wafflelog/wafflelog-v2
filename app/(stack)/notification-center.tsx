import { TitleRegular } from "@/components/title/regular";
import { borderRadiuses, colors, gaps, getColor } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import { actionPullActiveCompanionTrips } from "@/lib/sqlite/model/companion-trip-sync";
import {
  actionAcceptTripInvitation,
  actionListAppNotifications,
  actionMarkNotificationRead,
  actionRejectTripInvitation,
  type AppNotification,
} from "@/lib/supabase/actions";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type InvitationResponseInput = {
  notificationId: string;
  invitationId: string;
  response: "accepted" | "rejected";
};

const formatNotificationTimestamp = (createdAt: string) => {
  const createdDate = dayjs(createdAt);
  const now = dayjs();
  const diffInMinutes = now.diff(createdDate, "minute");
  const diffInHours = now.diff(createdDate, "hour");
  const diffInDays = now.diff(createdDate, "day");

  if (diffInMinutes < 1) {
    return "Just now";
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  }

  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  }

  if (diffInDays === 1) {
    return "Yesterday";
  }

  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  return createdDate.format("D MMM YYYY");
};

export default function NotificationCenterScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuthSession();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const [activeNotificationId, setActiveNotificationId] = useState<string | null>(
    null,
  );

  const notificationsQuery = useQuery({
    queryKey: ["app-notifications", session?.user.id],
    queryFn: actionListAppNotifications,
    enabled: Boolean(session?.user.id),
  });

  const invitationResponseMutation = useMutation({
    mutationFn: async ({
      notificationId,
      invitationId,
      response,
    }: InvitationResponseInput) => {
      if (response === "accepted") {
        await actionAcceptTripInvitation(invitationId);
        await actionPullActiveCompanionTrips();
      } else {
        await actionRejectTripInvitation(invitationId);
      }

      await actionMarkNotificationRead(notificationId);

      return response;
    },
    onMutate: ({ notificationId }) => {
      setActiveNotificationId(notificationId);
    },
    onSuccess: (response) => {
      void queryClient.invalidateQueries({
        queryKey: ["app-notifications", session?.user.id],
      });
      void queryClient.invalidateQueries({ queryKey: ["local-trips", session?.user.id] });

      showMessage(
        response === "accepted" ? "Invitation accepted" : "Invitation declined",
        "info",
      );
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to update invitation";
      showMessage(message, "error");
    },
    onSettled: () => {
      setActiveNotificationId(null);
    },
  });

  const getNotificationIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "trip_invited":
        return "person-add";
      case "trip_invite_accepted":
        return "checkmark-circle";
      case "trip_invite_rejected":
        return "close-circle";
      default:
        return "notifications";
    }
  };

  const handleInvitationResponse = (
    notification: AppNotification,
    response: InvitationResponseInput["response"],
  ) => {
    if (!notification.trip_invitation_id) {
      showMessage("This invitation is no longer available", "error");
      return;
    }

    invitationResponseMutation.mutate({
      notificationId: notification.id,
      invitationId: notification.trip_invitation_id,
      response,
    });
  };

  const notifications = notificationsQuery.data ?? [];

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
        {notificationsQuery.isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={getColor(colors.turquoise)} />
          </View>
        ) : notifications.length === 0 ? (
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
          notifications.map((notification) => {
            const isUnread = notification.read_at === null;
            const isPendingInvitation =
              notification.type === "trip_invited" &&
              notification.invitationStatus === "pending";
            const isUpdating = activeNotificationId === notification.id;

            return (
              <View
                key={notification.id}
                style={[
                  styles.notificationItem,
                  isUnread && styles.notificationItemUnread,
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
                    {notification.body}
                  </Text>
                  <Text style={styles.notificationTimestamp}>
                    {formatNotificationTimestamp(notification.created_at)}
                  </Text>

                  {isPendingInvitation ? (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.acceptButton,
                          isUpdating && styles.actionButtonDisabled,
                        ]}
                        disabled={isUpdating}
                        onPress={() => {
                          handleInvitationResponse(notification, "accepted");
                        }}
                      >
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.declineButton,
                          isUpdating && styles.actionButtonDisabled,
                        ]}
                        disabled={isUpdating}
                        onPress={() => {
                          handleInvitationResponse(notification, "rejected");
                        }}
                      >
                        <Text style={styles.declineButtonText}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
                {isUnread && <View style={styles.unreadDot} />}
              </View>
            );
          })
        )}
      </ScrollView>
      <SystemMessageModal />
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
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: gaps.xl * 2,
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
  actionButtonDisabled: {
    opacity: 0.6,
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
