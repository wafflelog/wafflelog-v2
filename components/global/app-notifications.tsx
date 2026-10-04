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

  const { data: expoPushToken } =
    await Notifications.getExpoPushTokenAsync({ projectId });

  return expoPushToken;
}

export function GlobalAppNotifications() {
  useEffect(() => {
    void registerForPushNotifications().catch((error) => {
      console.warn("Unable to register for push notifications", error);
    });
  }, []);

  return null;
}
