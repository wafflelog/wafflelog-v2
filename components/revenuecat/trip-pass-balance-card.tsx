import { UIText } from "@/components/ui/text";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
  semanticColors,
} from "@/constants/theme";
import {
  aiTripPlanningQueryKeys,
  useTripPassBalance,
} from "@/hook/use-ai-trip-planning";
import { presentTripPassPaywall } from "@/lib/revenuecat/paywall";
import { useQueryClient } from "@tanstack/react-query";
import { Ticket as TicketIcon } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

type TripPassBalanceCardProps = {
  userId: string | null | undefined;
};

function getBalanceDescription(
  complimentaryPasses: number,
  purchasedPasses: number,
) {
  if (complimentaryPasses > 0 && purchasedPasses === 0) {
    return "1 complimentary pass";
  }

  const descriptions = [
    complimentaryPasses > 0
      ? `${complimentaryPasses} complimentary`
      : null,
    purchasedPasses > 0 ? `${purchasedPasses} purchased` : null,
  ].filter((description): description is string => description !== null);

  return descriptions.length > 0
    ? descriptions.join(" · ")
    : "Buy a pass when you're ready to plan.";
}

export function TripPassBalanceCard({ userId }: TripPassBalanceCardProps) {
  const queryClient = useQueryClient();
  const balanceQuery = useTripPassBalance(userId);
  const [isPresentingPaywall, setIsPresentingPaywall] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const balance = balanceQuery.data;
  const balanceLabel = balance
    ? `${balance.totalPasses} ${balance.totalPasses === 1 ? "pass" : "passes"}`
    : null;
  const balanceDescription = balance
    ? getBalanceDescription(
        balance.complimentaryPasses,
        balance.purchasedPasses,
      )
    : null;

  const handleBuyPasses = async () => {
    if (isPresentingPaywall || !userId) {
      return;
    }

    setIsPresentingPaywall(true);
    setPurchaseError(null);

    try {
      const result = await presentTripPassPaywall();

      if (result.status !== "cancelled") {
        await queryClient.invalidateQueries({
          queryKey: aiTripPlanningQueryKeys.tripPassBalance(userId),
        });
      }
    } catch (error) {
      setPurchaseError(
        error instanceof Error
          ? error.message
          : "Unable to open the Trip Assistant paywall.",
      );
    } finally {
      setIsPresentingPaywall(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.iconContainer}>
          <TicketIcon size={20} color={getColor(colors.purple)} />
        </View>

        <View style={styles.details}>
          <UIText style={styles.title} weight="700">
            Trip Assistant passes
          </UIText>

          {balanceQuery.isPending ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator
                color={getColor(colors.purple)}
                size="small"
              />
              <UIText style={styles.description}>Checking balance…</UIText>
            </View>
          ) : balanceQuery.isError ? (
            <View style={styles.errorRow}>
              <UIText style={styles.errorText}>Balance unavailable.</UIText>
              <Pressable
                accessibilityLabel="Retry Trip Assistant pass balance"
                accessibilityRole="button"
                onPress={() => void balanceQuery.refetch()}
              >
                <UIText style={styles.retryText} weight="700">
                  Try again
                </UIText>
              </Pressable>
            </View>
          ) : (
            <UIText style={styles.description}>{balanceDescription}</UIText>
          )}
        </View>

        {balanceLabel ? (
          <View style={styles.balanceContainer}>
            <UIText style={styles.balance} weight="700">
              {balanceLabel}
            </UIText>
            <UIText style={styles.availableLabel}>available</UIText>
          </View>
        ) : null}
      </View>

      <Pressable
        accessibilityLabel="Buy Trip Assistant passes"
        accessibilityRole="button"
        disabled={isPresentingPaywall || !userId}
        onPress={() => void handleBuyPasses()}
        style={({ pressed }) => [
          styles.purchaseButton,
          pressed && styles.purchaseButtonPressed,
          (isPresentingPaywall || !userId) && styles.purchaseButtonDisabled,
        ]}
      >
        {isPresentingPaywall ? (
          <ActivityIndicator
            color={semanticColors.primaryActionContent}
            size="small"
          />
        ) : null}
        <UIText style={styles.purchaseButtonText} weight="700">
          {isPresentingPaywall ? "Opening…" : "Buy passes"}
        </UIText>
      </Pressable>

      {purchaseError ? (
        <UIText accessibilityLiveRegion="polite" style={styles.purchaseError}>
          {purchaseError}
        </UIText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: gaps.sm,
    padding: gaps.md,
    borderWidth: 1,
    borderColor: getColor(colors.purple, 0.22),
    borderRadius: borderRadiuses.md,
    backgroundColor: getColor(colors.purple, 0.05),
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: gaps.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.purple, 0.1),
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: semanticColors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  description: {
    marginTop: 2,
    color: semanticColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.xs,
    marginTop: 2,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: gaps.xs,
    marginTop: 2,
  },
  errorText: {
    color: semanticColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  retryText: {
    color: getColor(colors.purple),
    fontSize: 12,
    lineHeight: 17,
  },
  balanceContainer: {
    alignItems: "flex-end",
  },
  balance: {
    color: getColor(colors.purple),
    fontSize: 16,
    lineHeight: 22,
  },
  availableLabel: {
    color: semanticColors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },
  purchaseButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xs,
    paddingHorizontal: gaps.md,
    borderRadius: borderRadiuses.full,
    backgroundColor: semanticColors.primaryAction,
  },
  purchaseButtonPressed: {
    opacity: 0.84,
  },
  purchaseButtonDisabled: {
    opacity: 0.55,
  },
  purchaseButtonText: {
    color: semanticColors.primaryActionContent,
    fontSize: 14,
    lineHeight: 20,
  },
  purchaseError: {
    color: getColor(colors.red),
    fontSize: 12,
    lineHeight: 17,
  },
});
