import Purchases from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";

import { TRIP_ASSISTANT_CURRENCY_CODE } from "./catalog";

export type TripPassPaywallResult =
  | { status: "cancelled" }
  | {
      status: "purchased" | "restored";
      balance: number | null;
    };

async function refreshTripPassBalance() {
  try {
    await Purchases.invalidateVirtualCurrenciesCache();
    const virtualCurrencies = await Purchases.getVirtualCurrencies();

    return (
      virtualCurrencies.all[TRIP_ASSISTANT_CURRENCY_CODE]?.balance ?? null
    );
  } catch (error) {
    console.warn(
      "The Trip Assistant Pass balance could not be refreshed after the Paywall closed.",
      error,
    );
    return null;
  }
}

export async function presentTripPassPaywall(): Promise<TripPassPaywallResult> {
  const offerings = await Purchases.getOfferings();

  if (!offerings.current) {
    throw new Error("The current RevenueCat Offering is unavailable.");
  }

  const result = await RevenueCatUI.presentPaywall({
    offering: offerings.current,
    displayCloseButton: true,
  });

  switch (result) {
    case PAYWALL_RESULT.CANCELLED:
      return { status: "cancelled" };
    case PAYWALL_RESULT.PURCHASED:
      return {
        status: "purchased",
        balance: await refreshTripPassBalance(),
      };
    case PAYWALL_RESULT.RESTORED:
      return {
        status: "restored",
        balance: await refreshTripPassBalance(),
      };
    case PAYWALL_RESULT.ERROR:
      throw new Error("The RevenueCat Paywall could not complete the purchase.");
    case PAYWALL_RESULT.NOT_PRESENTED:
      throw new Error("The RevenueCat Paywall could not be presented.");
  }
}
