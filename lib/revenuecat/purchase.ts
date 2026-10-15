import Purchases from "react-native-purchases";

import { TRIP_ASSISTANT_CURRENCY_CODE } from "./catalog";

const TRIP_ASSISTANT_PRODUCT_IDENTIFIER =
  "wafflelog_trip_assistant_pass_1";

type TripAssistantPurchaseResult =
  | { status: "cancelled" }
  | {
      status: "purchased";
      balance: number;
      productIdentifier: string;
    };

function isPurchaseCancellation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code ===
      Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
  );
}

export async function purchaseTripAssistantPass(): Promise<TripAssistantPurchaseResult> {
  const offerings = await Purchases.getOfferings();
  const tripAssistantPackage = offerings.current?.availablePackages.find(
    (availablePackage) =>
      availablePackage.product.identifier ===
      TRIP_ASSISTANT_PRODUCT_IDENTIFIER,
  );

  if (!tripAssistantPackage) {
    throw new Error(
      `Product ${TRIP_ASSISTANT_PRODUCT_IDENTIFIER} is not available in the current RevenueCat Offering.`,
    );
  }

  try {
    const purchase = await Purchases.purchasePackage(tripAssistantPackage);

    await Purchases.invalidateVirtualCurrenciesCache();
    const virtualCurrencies = await Purchases.getVirtualCurrencies();
    const tripAssistantCurrency =
      virtualCurrencies.all[TRIP_ASSISTANT_CURRENCY_CODE];

    if (!tripAssistantCurrency) {
      throw new Error(
        `RevenueCat did not return the ${TRIP_ASSISTANT_CURRENCY_CODE} currency after purchase.`,
      );
    }

    return {
      status: "purchased",
      balance: tripAssistantCurrency.balance,
      productIdentifier: purchase.productIdentifier,
    };
  } catch (error) {
    if (isPurchaseCancellation(error)) {
      return { status: "cancelled" };
    }

    throw error;
  }
}
