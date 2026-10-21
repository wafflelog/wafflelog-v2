import { AppHeader } from "@/components/header/app-header";
import { HeaderBackButton } from "@/components/header/icon-button";
import { DeleteAccountDialog } from "@/components/dialog/delete-account";
import { UIText } from "@/components/ui/text";
import { TripPassBalanceCard } from "@/components/revenuecat/trip-pass-balance-card";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
  semanticColors,
} from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useAnalyticsConsent } from "@/hook/use-analytics-consent";
import {
  type NotificationPermissionState,
  useNotificationPermission,
} from "@/hook/use-notification-permission";
import { useSystemMessage } from "@/hook/use-system-message";
import { actionDeleteAccount } from "@/lib/account/delete-account";
import { clearAnalyticsConsent } from "@/lib/analytics-consent";
import { supabase } from "@/lib/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  Bell as BellIcon,
  ChartNoAxesColumnIncreasing as AnalyticsIcon,
  ChevronRight as ChevronRightIcon,
  LogOut as LogOutIcon,
  Trash2 as Trash2Icon,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const notificationStatusLabels: Record<NotificationPermissionState, string> = {
  loading: "Checking…",
  enabled: "On",
  disabled: "Off",
  "not-determined": "Not enabled",
  unavailable: "Unavailable",
};

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { session } = useAuthSession();
  const {
    isEnabled: isAnalyticsEnabled,
    isUpdating: isUpdatingAnalytics,
    setEnabled: setAnalyticsEnabled,
    status: analyticsStatus,
  } = useAnalyticsConsent();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const { permissionState, isManagingPermission, managePermission } =
    useNotificationPermission();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const deleteAccountMutation = useMutation({
    mutationFn: () =>
      actionDeleteAccount({
        clearAnalyticsConsent: () =>
          session?.user.id
            ? clearAnalyticsConsent(session.user.id)
            : Promise.resolve(),
        clearClientCache: () => queryClient.clear(),
      }),
    onError: (error) => {
      setIsDeleteDialogOpen(false);
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete your account right now",
        "error",
      );
    },
  });

  const username = session?.user.user_metadata.username || "Traveler";
  const usernameInitial = username.trim().charAt(0).toUpperCase() || "T";

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await supabase.auth.signOut({ scope: "local" });
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleAnalyticsChange = async (enabled: boolean) => {
    try {
      await setAnalyticsEnabled(enabled);
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to update usage analytics",
        "error",
      );
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
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
          style={[styles.sectionLabel, styles.sectionSpacing]}
          weight="700"
        >
          Trip Assistant
        </UIText>

        <TripPassBalanceCard userId={session?.user.id} />

        <UIText
          style={[styles.sectionLabel, styles.sectionSpacing]}
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

        <UIText
          style={[styles.sectionLabel, styles.sectionSpacing]}
          weight="700"
        >
          Privacy
        </UIText>

        <View style={styles.analyticsCard}>
          <View style={styles.analyticsIcon}>
            <AnalyticsIcon size={20} color={getColor(colors.purple)} />
          </View>
          <View style={styles.analyticsDetails}>
            <UIText style={styles.analyticsTitle} weight="700">
              Usage analytics
            </UIText>
            <UIText style={styles.analyticsDescription}>
              Share how you use Wafflelog to help improve the app. Never used
              for advertising.
            </UIText>
          </View>
          <Switch
            accessibilityLabel="Usage analytics"
            accessibilityHint="Controls whether Wafflelog collects usage analytics"
            disabled={analyticsStatus === "loading" || isUpdatingAnalytics}
            onValueChange={(enabled) => void handleAnalyticsChange(enabled)}
            value={isAnalyticsEnabled}
            trackColor={{
              false: getColor(colors.whiteGrey),
              true: getColor(colors.purple, 0.45),
            }}
            thumbColor={
              isAnalyticsEnabled
                ? getColor(colors.purple)
                : getColor(colors.white)
            }
          />
        </View>

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

        <Pressable
          accessibilityLabel="Delete account"
          accessibilityRole="button"
          disabled={deleteAccountMutation.isPending}
          onPress={() => setIsDeleteDialogOpen(true)}
          style={({ pressed }) => [
            styles.deleteAccountButton,
            pressed && styles.deleteAccountButtonPressed,
            deleteAccountMutation.isPending && styles.deleteAccountButtonDisabled,
          ]}
        >
          <Trash2Icon size={18} color={getColor(colors.red)} />
          <UIText style={styles.deleteAccountText} weight="600">
            Delete account
          </UIText>
        </Pressable>
      </ScrollView>

      {isDeleteDialogOpen ? (
        <DeleteAccountDialog
          visible
          onDismiss={() => setIsDeleteDialogOpen(false)}
          onConfirm={() => deleteAccountMutation.mutate()}
          isPending={deleteAccountMutation.isPending}
        />
      ) : null}
      <SystemMessageModal />
    </View>
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
  sectionSpacing: {
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
  analyticsCard: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
    padding: gaps.md,
    borderWidth: 1,
    borderColor: semanticColors.neutralDivider,
    borderRadius: borderRadiuses.md,
    backgroundColor: semanticColors.surface,
  },
  analyticsIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.purple, 0.1),
  },
  analyticsDetails: {
    flex: 1,
    minWidth: 0,
  },
  analyticsTitle: {
    color: semanticColors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  analyticsDescription: {
    marginTop: 2,
    color: semanticColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
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
  deleteAccountButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xs,
    marginTop: gaps.xs,
    paddingHorizontal: gaps.md,
    borderRadius: borderRadiuses.full,
  },
  deleteAccountButtonPressed: {
    backgroundColor: getColor(colors.red, 0.06),
  },
  deleteAccountButtonDisabled: {
    opacity: 0.6,
  },
  deleteAccountText: {
    color: getColor(colors.red),
    fontSize: 13,
    lineHeight: 18,
  },
});
