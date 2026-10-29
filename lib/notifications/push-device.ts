import {
  actionRemovePushDevice,
  actionUpsertPushDevice,
} from "@/lib/supabase/actions";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const DEFAULT_NOTIFICATION_CHANNEL_ID = "default";

function getExpoProjectId() {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    throw new Error("Expo project ID is not configured");
  }

  return projectId;
}

function isPushPlatform(
  platform: string,
): platform is "ios" | "android" {
  return platform === "ios" || platform === "android";
}

async function getExpoPushToken() {
  const { data } = await Notifications.getExpoPushTokenAsync({
    projectId: getExpoProjectId(),
  });

  return data;
}

export async function registerCurrentPushDevice() {
  const platform = Platform.OS;

  if (!isPushPlatform(platform)) {
    return null;
  }

  if (platform === "android") {
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

  const expoPushToken = await getExpoPushToken();
  await actionUpsertPushDevice({ expoPushToken, platform });

  return expoPushToken;
}

export async function removeCurrentPushDevice() {
  if (!isPushPlatform(Platform.OS)) {
    return;
  }

  const permissions = await Notifications.getPermissionsAsync();

  if (!permissions.granted) {
    return;
  }

  const expoPushToken = await getExpoPushToken();
  await actionRemovePushDevice(expoPushToken);
}
