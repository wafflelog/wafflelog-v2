import { useAuthSession } from "@/hook/use-auth-session";
import { getAppNotificationsQueryKey } from "@/hook/use-app-notifications";
import { actionUpsertPushDevice } from "@/lib/supabase/actions";
import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";

const DEFAULT_NOTIFICATION_CHANNEL_ID = "default";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotifications() {
  if (Platform.OS !== "ios" && Platform.OS !== "android") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(
      DEFAULT_NOTIFICATION_CHANNEL_ID,
      {
        name: "Default",
        importance: Notifications.AndroidImportance.HIGH,
      },
    );
  }

  const existingPermissions = await Notifications.getPermissionsAsync();
  const permissions = existingPermissions.granted
    ? existingPermissions
    : await Notifications.requestPermissionsAsync();

  if (!permissions.granted) {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    throw new Error("Expo project ID is not configured");
  }

  const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  return expoPushToken;
}

export function GlobalAppNotifications() {
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const appStateRef = useRef(AppState.currentState);
  const userId = session?.user.id;

  useEffect(() => {
    const platform = Platform.OS;

    if (!userId || (platform !== "ios" && platform !== "android")) {
      return;
    }

    void registerForPushNotifications()
      .then((expoPushToken) => {
        if (!expoPushToken) {
          return;
        }

        return actionUpsertPushDevice({ expoPushToken, platform });
      })
      .catch((error) => {
        console.warn("Unable to register for push notifications", error);
      });
  }, [userId]);

  useEffect(() => {
    const platform = Platform.OS;

    if (!userId || (platform !== "ios" && platform !== "android")) {
      return;
    }

    appStateRef.current = AppState.currentState;

    const refreshNotifications = () => {
      void queryClient.invalidateQueries({
        queryKey: getAppNotificationsQueryKey(userId),
      });
    };
    const notificationSubscription =
      Notifications.addNotificationReceivedListener(refreshNotifications);
    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        const wasInactive =
          appStateRef.current === "background" ||
          appStateRef.current === "inactive";

        appStateRef.current = nextAppState;

        if (wasInactive && nextAppState === "active") {
          refreshNotifications();
        }
      },
    );

    return () => {
      notificationSubscription.remove();
      appStateSubscription.remove();
    };
  }, [queryClient, userId]);

  return null;
}
