import { useAuthSession } from "@/hook/use-auth-session";
import { actionUpsertPushDevice } from "@/lib/supabase/actions";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";

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

  useEffect(() => {
    const platform = Platform.OS;

    if (!session?.user.id || (platform !== "ios" && platform !== "android")) {
      return;
    }

    void registerForPushNotifications()
      .then((expoPushToken) => {
        console.log("Expo push token:", expoPushToken);

        if (!expoPushToken) {
          return;
        }

        return actionUpsertPushDevice({ expoPushToken, platform });
      })
      .catch((error) => {
        console.warn("Unable to register for push notifications", error);
      });
  }, [session?.user.id]);

  return null;
}
