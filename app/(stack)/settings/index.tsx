import { AppHeader } from "@/components/header/app-header";
import { HeaderBackButton } from "@/components/header/icon-button";
import { UIText } from "@/components/ui/text";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
  semanticColors,
} from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import {
  type NotificationPermissionState,
  useNotificationPermission,
} from "@/hook/use-notification-permission";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "expo-router";
import {
  Bell as BellIcon,
  ChevronRight as ChevronRightIcon,
  LogOut as LogOutIcon,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const notificationStatusLabels: Record<NotificationPermissionState, string> = {
  loading: "Checking…",
  enabled: "On",
  disabled: "Off",
  "not-determined": "Not enabled",
  unavailable: "Unavailable",
};

export default function SettingsScreen() {
  const router = useRouter();
  const { session } = useAuthSession();
  const {
    permissionState,
    isManagingPermission,
    managePermission,
  } = useNotificationPermission();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const username = session?.user.user_metadata.username || "Traveler";
  const usernameInitial = username.trim().charAt(0).toUpperCase() || "T";

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await supabase.auth.signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <AppHeader
        title="Settings"
        leading={<HeaderBackButton onPress={() => router.back()} />}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <UIText style={styles.sectionLabel} weight="700">
          Account
        </UIText>

        <View style={styles.accountCard}>
          <View style={styles.avatar}>
            <UIText style={styles.avatarText} weight="700">
              {usernameInitial}
            </UIText>
          </View>
          <View style={styles.accountDetails}>
            <UIText style={styles.accountLabel}>Username</UIText>
            <UIText style={styles.username} weight="700">
              @{username}
            </UIText>
          </View>
        </View>

        <UIText
          style={[styles.sectionLabel, styles.notificationSectionLabel]}
          weight="700"
        >
          Notifications
        </UIText>

        <Pressable
          accessibilityHint={
            permissionState === "not-determined"
              ? "Requests permission to send push notifications"
              : "Opens this app's notification settings"
          }
          accessibilityLabel={`Push notifications, ${notificationStatusLabels[permissionState]}`}
          accessibilityRole="button"
          disabled={
            permissionState === "loading" ||
            permissionState === "unavailable" ||
            isManagingPermission
          }
          onPress={() => void managePermission()}
          style={({ pressed }) => [
            styles.notificationCard,
            pressed && styles.notificationCardPressed,
          ]}
        >
          <View style={styles.notificationIcon}>
            <BellIcon size={20} color={getColor(colors.purple)} />
          </View>
          <View style={styles.notificationDetails}>
            <UIText style={styles.notificationTitle} weight="700">
              Push notifications
            </UIText>
            <UIText style={styles.notificationDescription}>
              Receive an alert when someone invites you to a trip.
            </UIText>
          </View>
          <View style={styles.notificationAction}>
            <UIText
              style={[
                styles.notificationStatus,
                permissionState === "enabled" &&
                  styles.notificationStatusEnabled,
              ]}
              weight="600"
            >
              {notificationStatusLabels[permissionState]}
            </UIText>
            {permissionState !== "unavailable" && (
              <ChevronRightIcon
                size={18}
                color={semanticColors.textSecondary}
              />
            )}
          </View>
        </Pressable>

        <Pressable
          accessibilityLabel="Sign out"
          accessibilityRole="button"
          disabled={isSigningOut}
          onPress={() => void handleSignOut()}
          style={({ pressed }) => [
            styles.signOutButton,
            pressed && styles.signOutButtonPressed,
            isSigningOut && styles.signOutButtonDisabled,
          ]}
        >
          <LogOutIcon size={20} color={getColor(colors.red)} />
          <UIText style={styles.signOutText} weight="700">
            {isSigningOut ? "Signing out…" : "Sign out"}
          </UIText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColors.screen,
  },
  content: {
    padding: gaps.md,
    paddingBottom: gaps.xl,
  },
  sectionLabel: {
    marginBottom: gaps.xs,
    color: semanticColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  notificationSectionLabel: {
    marginTop: gaps.lg,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
    padding: gaps.md,
    borderWidth: 1,
    borderColor: semanticColors.neutralDivider,
    borderRadius: borderRadiuses.md,
    backgroundColor: semanticColors.surface,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadiuses.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: getColor(colors.purple, 0.12),
  },
  avatarText: {
    color: getColor(colors.purple),
    fontSize: 20,
    lineHeight: 26,
  },
  accountDetails: {
    flex: 1,
    minWidth: 0,
  },
  accountLabel: {
    color: semanticColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  username: {
    marginTop: 2,
    color: semanticColors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  },
  notificationCard: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
    padding: gaps.md,
    borderWidth: 1,
    borderColor: semanticColors.neutralDivider,
    borderRadius: borderRadiuses.md,
    backgroundColor: semanticColors.surface,
  },
  notificationCardPressed: {
    backgroundColor: getColor(colors.purple, 0.05),
  },
  notificationIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.purple, 0.1),
  },
  notificationDetails: {
    flex: 1,
    minWidth: 0,
  },
  notificationTitle: {
    color: semanticColors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  notificationDescription: {
    marginTop: 2,
    color: semanticColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  notificationAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.xxs,
  },
  notificationStatus: {
    color: semanticColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  notificationStatusEnabled: {
    color: getColor(colors.purple),
  },
  signOutButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xs,
    marginTop: gaps.lg,
    paddingHorizontal: gaps.md,
    borderWidth: 1,
    borderColor: getColor(colors.red, 0.35),
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.red, 0.06),
  },
  signOutButtonPressed: {
    backgroundColor: getColor(colors.red, 0.12),
  },
  signOutButtonDisabled: {
    opacity: 0.6,
  },
  signOutText: {
    color: getColor(colors.red),
    fontSize: 14,
    lineHeight: 20,
  },
});
