import {
  getAnalytics,
  resetAnalyticsData,
  setAnalyticsCollectionEnabled,
} from "@react-native-firebase/analytics";
import {
  deleteItemAsync,
  getItemAsync,
  setItemAsync,
} from "expo-secure-store";

export type AnalyticsConsentPreference = "enabled" | "disabled";

type AnalyticsConsentDependencies = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  deleteItem: (key: string) => Promise<void>;
  setCollectionEnabled: (enabled: boolean) => Promise<void>;
  resetData: () => Promise<void>;
};

const analytics = getAnalytics();

const defaultDependencies: AnalyticsConsentDependencies = {
  getItem: getItemAsync,
  setItem: setItemAsync,
  deleteItem: deleteItemAsync,
  setCollectionEnabled: (enabled) =>
    setAnalyticsCollectionEnabled(analytics, enabled),
  resetData: () => resetAnalyticsData(analytics),
};

const getAnalyticsConsentKey = (userId: string) =>
  `wafflelog.analytics-consent.${userId}`;

export async function getAnalyticsConsent(
  userId: string,
  dependencies: AnalyticsConsentDependencies = defaultDependencies,
): Promise<AnalyticsConsentPreference | null> {
  const storedPreference = await dependencies.getItem(
    getAnalyticsConsentKey(userId),
  );

  return storedPreference === "enabled" || storedPreference === "disabled"
    ? storedPreference
    : null;
}

export async function setAnalyticsConsent(
  userId: string,
  enabled: boolean,
  dependencies: AnalyticsConsentDependencies = defaultDependencies,
) {
  const preference: AnalyticsConsentPreference = enabled
    ? "enabled"
    : "disabled";

  if (enabled) {
    await dependencies.setItem(getAnalyticsConsentKey(userId), preference);
    await dependencies.setCollectionEnabled(true);
    return;
  }

  await dependencies.setCollectionEnabled(false);
  await dependencies.setItem(getAnalyticsConsentKey(userId), preference);

  try {
    await dependencies.resetData();
  } catch (error) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn("Unable to reset the Firebase analytics identifier", error);
    }
  }
}

export async function suspendAnalyticsCollection(
  resetData = false,
  dependencies: AnalyticsConsentDependencies = defaultDependencies,
) {
  await dependencies.setCollectionEnabled(false);

  if (resetData) {
    await dependencies.resetData();
  }
}

export async function clearAnalyticsConsent(
  userId: string,
  dependencies: AnalyticsConsentDependencies = defaultDependencies,
) {
  await dependencies.setCollectionEnabled(false);
  await dependencies.deleteItem(getAnalyticsConsentKey(userId));

  try {
    await dependencies.resetData();
  } catch (error) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn("Unable to reset the Firebase analytics identifier", error);
    }
  }
}
