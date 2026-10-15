import { UIText } from "@/components/ui/text";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
  semanticColors,
} from "@/constants/theme";
import { getRevenueCatCatalogueSnapshot } from "@/lib/revenuecat/catalog";
import { presentTripPassPaywall } from "@/lib/revenuecat/paywall";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

async function getTripPassBalance() {
  const catalogue = await getRevenueCatCatalogueSnapshot();

  if (!catalogue?.offering || !catalogue.tripAssistantCurrency) {
    throw new Error("The Test Store Offering or TRIPPASS currency is unavailable.");
  }

  return catalogue.tripAssistantCurrency.balance;
}

export function RevenueCatTestPurchaseCard() {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPresenting, setIsPresenting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadBalance = async () => {
      try {
        const nextBalance = await getTripPassBalance();

        if (isMounted) {
          setBalance(nextBalance);
        }
      } catch (error) {
        if (isMounted) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to load the RevenueCat Offering.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadBalance();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenPaywall = async () => {
    if (isPresenting) {
      return;
    }

    setIsPresenting(true);
    setMessage(null);

    try {
      const result = await presentTripPassPaywall();

      switch (result.status) {
        case "cancelled":
          break;
        case "purchased": {
          if (result.balance !== null) {
            setBalance(result.balance);
          }
          setMessage(
            result.balance === null
              ? "Purchase completed. Your pass balance will refresh shortly."
              : `Purchase completed. ${result.balance} ${result.balance === 1 ? "pass" : "passes"} available.`,
          );
          break;
        }
        case "restored": {
          if (result.balance !== null) {
            setBalance(result.balance);
          }
          setMessage("Purchases restored.");
          break;
        }
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to open the RevenueCat Paywall.",
      );
    } finally {
      setIsPresenting(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <UIText style={styles.title} weight="700">
            Trip Assistant Pass
          </UIText>
          <UIText style={styles.description}>
            Development-only RevenueCat Paywall preview.
          </UIText>
        </View>
        <UIText style={styles.balance} weight="700">
          {isLoading ? "…" : `${balance ?? 0} passes`}
        </UIText>
      </View>

      <Pressable
        accessibilityLabel="Open RevenueCat Trip Assistant Pass Paywall"
        accessibilityRole="button"
        disabled={isLoading || isPresenting || balance === null}
        onPress={() => void handleOpenPaywall()}
        style={({ pressed }) => [
          styles.purchaseButton,
          pressed && styles.purchaseButtonPressed,
          (isLoading || isPresenting || balance === null) &&
            styles.purchaseButtonDisabled,
        ]}
      >
        {isPresenting && (
          <ActivityIndicator
            color={semanticColors.primaryActionContent}
            size="small"
          />
        )}
        <UIText style={styles.purchaseButtonText} weight="700">
          {isPresenting ? "Opening…" : "Open RevenueCat Paywall"}
        </UIText>
      </Pressable>

      {message && <UIText style={styles.message}>{message}</UIText>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: gaps.sm,
    padding: gaps.md,
    borderWidth: 1,
    borderColor: getColor(colors.purple, 0.24),
    borderRadius: borderRadiuses.md,
    backgroundColor: getColor(colors.purple, 0.05),
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: gaps.sm,
  },
  headingCopy: {
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
  balance: {
    color: getColor(colors.purple),
    fontSize: 12,
    lineHeight: 17,
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
  message: {
    color: semanticColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
});
