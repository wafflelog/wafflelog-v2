import { describe, expect, it, vi } from "vitest";

import { runTripPassPaywallFlow } from "./trip-pass-retry";

const attempt = {
  destination: "Lisbon",
  idempotencyKey: "planning-request-1",
};

describe("Trip Pass planning retry", () => {
  it("leaves the original submission untouched when the Paywall is cancelled", async () => {
    const retrySubmission = vi.fn();

    await expect(
      runTripPassPaywallFlow({
        attempt,
        presentPaywall: vi.fn().mockResolvedValue({ status: "cancelled" }),
        retrySubmission,
      }),
    ).resolves.toBe("cancelled");

    expect(retrySubmission).not.toHaveBeenCalled();
  });

  it.each(["purchased", "restored"] as const)(
    "retries the exact original submission after passes are %s",
    async (status) => {
      const retrySubmission = vi.fn().mockResolvedValue(undefined);

      await expect(
        runTripPassPaywallFlow({
          attempt,
          presentPaywall: vi.fn().mockResolvedValue({ status, balance: 4 }),
          retrySubmission,
        }),
      ).resolves.toBe("retried");

      expect(retrySubmission).toHaveBeenCalledOnce();
      expect(retrySubmission).toHaveBeenCalledWith(attempt);
      expect(retrySubmission.mock.calls[0]?.[0]).toBe(attempt);
      expect(retrySubmission.mock.calls[0]?.[0].idempotencyKey).toBe(
        "planning-request-1",
      );
    },
  );

  it("does not retry when presenting the Paywall fails", async () => {
    const error = new Error("Paywall unavailable");
    const retrySubmission = vi.fn();

    await expect(
      runTripPassPaywallFlow({
        attempt,
        presentPaywall: vi.fn().mockRejectedValue(error),
        retrySubmission,
      }),
    ).rejects.toBe(error);

    expect(retrySubmission).not.toHaveBeenCalled();
  });
});
