import { describe, expect, it, vi } from "vitest";

vi.mock("@react-native-firebase/analytics", () => ({
  getAnalytics: vi.fn(() => ({})),
  resetAnalyticsData: vi.fn(),
  setAnalyticsCollectionEnabled: vi.fn(),
}));

vi.mock("expo-secure-store", () => ({
  deleteItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
}));

import {
  clearAnalyticsConsent,
  getAnalyticsConsent,
  setAnalyticsConsent,
  suspendAnalyticsCollection,
} from "@/lib/analytics-consent";

function createDependencies(storedValue: string | null = null) {
  return {
    getItem: vi.fn().mockResolvedValue(storedValue),
    setItem: vi.fn().mockResolvedValue(undefined),
    deleteItem: vi.fn().mockResolvedValue(undefined),
    setCollectionEnabled: vi.fn().mockResolvedValue(undefined),
    resetData: vi.fn().mockResolvedValue(undefined),
  };
}

describe("analytics consent", () => {
  it("returns no preference when the user has not made a choice", async () => {
    const dependencies = createDependencies();

    await expect(
      getAnalyticsConsent("user-1", dependencies),
    ).resolves.toBeNull();
  });

  it("stores the opt-in before enabling collection", async () => {
    const callOrder: string[] = [];
    const dependencies = createDependencies();
    dependencies.setItem.mockImplementation(async () => {
      callOrder.push("stored");
    });
    dependencies.setCollectionEnabled.mockImplementation(async () => {
      callOrder.push("enabled");
    });

    await setAnalyticsConsent("user-1", true, dependencies);

    expect(dependencies.setItem).toHaveBeenCalledWith(
      "wafflelog.analytics-consent.user-1",
      "enabled",
    );
    expect(dependencies.setCollectionEnabled).toHaveBeenCalledWith(true);
    expect(callOrder).toEqual(["stored", "enabled"]);
  });

  it("stops collection and resets the identifier when the user opts out", async () => {
    const dependencies = createDependencies("enabled");

    await setAnalyticsConsent("user-1", false, dependencies);

    expect(dependencies.setCollectionEnabled).toHaveBeenCalledWith(false);
    expect(dependencies.resetData).toHaveBeenCalledOnce();
    expect(dependencies.setItem).toHaveBeenCalledWith(
      "wafflelog.analytics-consent.user-1",
      "disabled",
    );
  });

  it("keeps the user opted out when resetting the identifier fails", async () => {
    const dependencies = createDependencies("enabled");
    dependencies.resetData.mockRejectedValueOnce(new Error("Reset failed"));

    await setAnalyticsConsent("user-1", false, dependencies);

    expect(dependencies.setCollectionEnabled).toHaveBeenCalledWith(false);
    expect(dependencies.setItem).toHaveBeenCalledWith(
      "wafflelog.analytics-consent.user-1",
      "disabled",
    );
  });

  it("can suspend collection without changing the saved preference", async () => {
    const dependencies = createDependencies("enabled");

    await suspendAnalyticsCollection(false, dependencies);

    expect(dependencies.setCollectionEnabled).toHaveBeenCalledWith(false);
    expect(dependencies.resetData).not.toHaveBeenCalled();
    expect(dependencies.setItem).not.toHaveBeenCalled();
  });

  it("removes the saved preference during account deletion", async () => {
    const dependencies = createDependencies("enabled");

    await clearAnalyticsConsent("user-1", dependencies);

    expect(dependencies.setCollectionEnabled).toHaveBeenCalledWith(false);
    expect(dependencies.resetData).toHaveBeenCalledOnce();
    expect(dependencies.deleteItem).toHaveBeenCalledWith(
      "wafflelog.analytics-consent.user-1",
    );
  });
});
