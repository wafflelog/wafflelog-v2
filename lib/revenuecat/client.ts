import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";

const testStoreApiKey =
  process.env.EXPO_PUBLIC_REVENUECAT_TEST_STORE_API_KEY;

let identitySyncQueue = Promise.resolve();
let hasWarnedAboutMissingKey = false;

async function syncIdentity(appUserId: string | null) {
  if (Platform.OS === "web") {
    return;
  }

  if (!testStoreApiKey) {
    if (!hasWarnedAboutMissingKey) {
      console.warn(
        "RevenueCat is not configured because EXPO_PUBLIC_REVENUECAT_TEST_STORE_API_KEY is missing.",
      );
      hasWarnedAboutMissingKey = true;
    }

    return;
  }

  if (!__DEV__) {
    console.error(
      "RevenueCat Test Store initialization was skipped in a release build.",
    );
    return;
  }

  await Purchases.setLogLevel(LOG_LEVEL.DEBUG);

  if (!(await Purchases.isConfigured())) {
    Purchases.configure({
      apiKey: testStoreApiKey,
      appUserID: appUserId ?? undefined,
    });
    return;
  }

  if (appUserId) {
    const currentAppUserId = await Purchases.getAppUserID();

    if (currentAppUserId !== appUserId) {
      await Purchases.logIn(appUserId);
    }

    return;
  }

  if (!(await Purchases.isAnonymous())) {
    await Purchases.logOut();
  }
}

export function syncRevenueCatIdentity(appUserId: string | null) {
  identitySyncQueue = identitySyncQueue
    .then(() => syncIdentity(appUserId))
    .catch((error) => {
      console.error("Unable to synchronize RevenueCat identity:", error);
    });

  return identitySyncQueue;
}
