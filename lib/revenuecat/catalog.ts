import Purchases from "react-native-purchases";

export const TRIP_ASSISTANT_CURRENCY_CODE = "TRIPPASS";

export async function getRevenueCatCatalogueSnapshot() {
  if (!(await Purchases.isConfigured())) {
    return null;
  }

  const [offerings, virtualCurrencies] = await Promise.all([
    Purchases.getOfferings(),
    Purchases.getVirtualCurrencies(),
  ]);
  const currentOffering = offerings.current;
  const tripAssistantCurrency =
    virtualCurrencies.all[TRIP_ASSISTANT_CURRENCY_CODE] ?? null;

  return {
    offering: currentOffering
      ? {
          identifier: currentOffering.identifier,
          packages: currentOffering.availablePackages.map((availablePackage) => ({
            identifier: availablePackage.identifier,
            productIdentifier: availablePackage.product.identifier,
            price: availablePackage.product.priceString,
          })),
        }
      : null,
    tripAssistantCurrency: tripAssistantCurrency
      ? {
          code: tripAssistantCurrency.code,
          name: tripAssistantCurrency.name,
          balance: tripAssistantCurrency.balance,
        }
      : null,
  };
}
