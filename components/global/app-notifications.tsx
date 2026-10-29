import { useAuthSession } from "@/hook/use-auth-session";
import { getAppNotificationsQueryKey } from "@/hook/use-app-notifications";
import { registerCurrentPushDevice } from "@/lib/notifications/push-device";
import { useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

    void registerCurrentPushDevice().catch((error) => {
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
