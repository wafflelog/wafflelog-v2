import { UIText } from "@/components/ui/text";
import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
  semanticColors,
} from "@/constants/theme";
import { getRevenueCatCatalogueSnapshot } from "@/lib/revenuecat/catalog";
import { purchaseTripAssistantPass } from "@/lib/revenuecat/purchase";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

type ProductDetails = {
  balance: number;
  price: string;
};

export function RevenueCatTestPurchaseCard() {
  const [productDetails, setProductDetails] =
    useState<ProductDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProductDetails = async () => {
      try {
        const catalogue = await getRevenueCatCatalogueSnapshot();
        const firstPackage = catalogue?.offering?.packages[0];

        if (!catalogue?.tripAssistantCurrency || !firstPackage) {
          throw new Error("The test product or TRIPPASS currency is unavailable.");
        }

        if (isMounted) {
          setProductDetails({
            balance: catalogue.tripAssistantCurrency.balance,
            price: firstPackage.price,
          });
        }
      } catch (error) {
        if (isMounted) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to load the Test Store product.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProductDetails();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePurchase = async () => {
    setIsPurchasing(true);
    setMessage(null);

    try {
      const result = await purchaseTripAssistantPass();

      switch (result.status) {
        case "cancelled":
          setMessage("Purchase cancelled. Nothing was charged.");
          break;
        case "purchased":
          setProductDetails((currentDetails) => ({
            balance: result.balance,
            price: currentDetails?.price ?? "",
          }));
          setMessage("Test purchase completed successfully.");
          break;
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The Test Store purchase failed.",
      );
    } finally {
      setIsPurchasing(false);
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
            Development-only RevenueCat Test Store control.
          </UIText>
        </View>
        <UIText style={styles.balance} weight="700">
          {isLoading ? "…" : `${productDetails?.balance ?? 0} passes`}
        </UIText>
      </View>

      <Pressable
        accessibilityLabel="Buy one test Trip Assistant Pass"
        accessibilityRole="button"
        disabled={isLoading || isPurchasing || !productDetails}
        onPress={() => void handlePurchase()}
        style={({ pressed }) => [
          styles.purchaseButton,
          pressed && styles.purchaseButtonPressed,
          (isLoading || isPurchasing || !productDetails) &&
            styles.purchaseButtonDisabled,
        ]}
      >
        {isPurchasing && (
          <ActivityIndicator
            color={semanticColors.primaryActionContent}
            size="small"
          />
        )}
        <UIText style={styles.purchaseButtonText} weight="700">
          {isPurchasing
            ? "Purchasing…"
            : `Buy test pass${productDetails ? ` · ${productDetails.price}` : ""}`}
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
