import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import { AppState, Platform } from "react-native";

export type NotificationPermissionState =
  | "loading"
  | "enabled"
  | "disabled"
  | "not-determined"
  | "unavailable";

const isNotificationPlatform =
  Platform.OS === "ios" || Platform.OS === "android";

function getPermissionState(
  permissions: Notifications.NotificationPermissionsStatus,
): NotificationPermissionState {
  const iosStatus = permissions.ios?.status;

  if (
    permissions.granted ||
    iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    iosStatus === Notifications.IosAuthorizationStatus.EPHEMERAL
  ) {
    return "enabled";
  }

  if (permissions.status === Notifications.PermissionStatus.UNDETERMINED) {
    return "not-determined";
  }

  return "disabled";
}

async function readPermissionState(): Promise<NotificationPermissionState> {
  if (!isNotificationPlatform) {
    return "unavailable";
  }

  const permissions = await Notifications.getPermissionsAsync();
  return getPermissionState(permissions);
}

export function useNotificationPermission() {
  const [permissionState, setPermissionState] =
    useState<NotificationPermissionState>(
      isNotificationPlatform ? "loading" : "unavailable",
    );
  const [isManagingPermission, setIsManagingPermission] = useState(false);

  const refreshPermission = useCallback(async () => {
    if (!isNotificationPlatform) {
      setPermissionState("unavailable");
      return;
    }

    try {
      setPermissionState(await readPermissionState());
    } catch (error) {
      console.warn("Unable to read notification permission", error);
      setPermissionState("unavailable");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    void readPermissionState()
      .then((nextPermissionState) => {
        if (isMounted) {
          setPermissionState(nextPermissionState);
        }
      })
      .catch((error) => {
        console.warn("Unable to read notification permission", error);

        if (isMounted) {
          setPermissionState("unavailable");
        }
      });

    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState === "active") {
          void refreshPermission();
        }
      },
    );

    return () => {
      isMounted = false;
      appStateSubscription.remove();
    };
  }, [refreshPermission]);

  const managePermission = useCallback(async () => {
    if (!isNotificationPlatform || isManagingPermission) {
      return;
    }

    setIsManagingPermission(true);

    try {
      const currentPermissions = await Notifications.getPermissionsAsync();

      if (
        currentPermissions.status ===
        Notifications.PermissionStatus.UNDETERMINED
      ) {
        const requestedPermissions =
          await Notifications.requestPermissionsAsync();
        setPermissionState(getPermissionState(requestedPermissions));
        return;
      }

      await Linking.openSettings();
    } catch (error) {
      console.warn("Unable to manage notification permission", error);
    } finally {
      setIsManagingPermission(false);
    }
  }, [isManagingPermission]);

  return {
    permissionState,
    isManagingPermission,
    managePermission,
  };
}
