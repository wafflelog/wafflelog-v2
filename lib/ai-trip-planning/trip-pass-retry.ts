import { type TripPassPaywallResult } from "@/lib/revenuecat/paywall";

type TripPassRetryOptions<TAttempt> = {
  attempt: TAttempt;
  presentPaywall: () => Promise<TripPassPaywallResult>;
  retrySubmission: (attempt: TAttempt) => Promise<void>;
};

export async function runTripPassPaywallFlow<TAttempt>({
  attempt,
  presentPaywall,
  retrySubmission,
}: TripPassRetryOptions<TAttempt>) {
  const result = await presentPaywall();

  if (result.status === "cancelled") {
    return "cancelled" as const;
  }

  await retrySubmission(attempt);

  return "retried" as const;
}
