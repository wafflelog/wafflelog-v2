import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOfferings: vi.fn(),
  getVirtualCurrencies: vi.fn(),
  invalidateVirtualCurrenciesCache: vi.fn(),
  presentPaywall: vi.fn(),
}));

vi.mock("react-native-purchases", () => ({
  default: {
    getOfferings: mocks.getOfferings,
    getVirtualCurrencies: mocks.getVirtualCurrencies,
    invalidateVirtualCurrenciesCache: mocks.invalidateVirtualCurrenciesCache,
  },
}));

vi.mock("react-native-purchases-ui", () => ({
  default: {
    presentPaywall: mocks.presentPaywall,
  },
  PAYWALL_RESULT: {
    CANCELLED: "CANCELLED",
    ERROR: "ERROR",
    NOT_PRESENTED: "NOT_PRESENTED",
    PURCHASED: "PURCHASED",
    RESTORED: "RESTORED",
  },
}));

describe("RevenueCat Trip Pass Paywall", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getOfferings.mockResolvedValue({
      current: { identifier: "trip-passes" },
    });
    mocks.invalidateVirtualCurrenciesCache.mockResolvedValue(undefined);
    mocks.getVirtualCurrencies.mockResolvedValue({
      all: {
        TRIPPASS: { balance: 5 },
      },
    });
  });

  it("rejects when there is no current Offering", async () => {
    mocks.getOfferings.mockResolvedValue({ current: null });

    const { presentTripPassPaywall } = await import("./paywall");

    await expect(presentTripPassPaywall()).rejects.toThrow(
      "The current RevenueCat Offering is unavailable.",
    );
    expect(mocks.presentPaywall).not.toHaveBeenCalled();
  });

  it("returns cancellation without refreshing the balance", async () => {
    mocks.presentPaywall.mockResolvedValue("CANCELLED");

    const { presentTripPassPaywall } = await import("./paywall");

    await expect(presentTripPassPaywall()).resolves.toEqual({
      status: "cancelled",
    });
    expect(mocks.invalidateVirtualCurrenciesCache).not.toHaveBeenCalled();
    expect(mocks.getVirtualCurrencies).not.toHaveBeenCalled();
  });

  it.each(["PURCHASED", "RESTORED"] as const)(
    "refreshes and returns the balance after %s",
    async (paywallResult) => {
      mocks.presentPaywall.mockResolvedValue(paywallResult);

      const { presentTripPassPaywall } = await import("./paywall");

      await expect(presentTripPassPaywall()).resolves.toEqual({
        status: paywallResult === "PURCHASED" ? "purchased" : "restored",
        balance: 5,
      });
      expect(mocks.invalidateVirtualCurrenciesCache).toHaveBeenCalledOnce();
      expect(mocks.getVirtualCurrencies).toHaveBeenCalledOnce();
      expect(
        mocks.invalidateVirtualCurrenciesCache.mock.invocationCallOrder[0],
      ).toBeLessThan(mocks.getVirtualCurrencies.mock.invocationCallOrder[0]);
    },
  );

  it("returns a null balance when the Trip Pass currency is absent", async () => {
    mocks.presentPaywall.mockResolvedValue("PURCHASED");
    mocks.getVirtualCurrencies.mockResolvedValue({ all: {} });

    const { presentTripPassPaywall } = await import("./paywall");

    await expect(presentTripPassPaywall()).resolves.toEqual({
      status: "purchased",
      balance: null,
    });
  });

  it.each([
    ["ERROR", "The RevenueCat Paywall could not complete the purchase."],
    ["NOT_PRESENTED", "The RevenueCat Paywall could not be presented."],
  ] as const)("rejects the %s result", async (paywallResult, message) => {
    mocks.presentPaywall.mockResolvedValue(paywallResult);

    const { presentTripPassPaywall } = await import("./paywall");

    await expect(presentTripPassPaywall()).rejects.toThrow(message);
  });
});
