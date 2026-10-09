import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { TitleRegular } from "@/components/title/regular";
import { UIText } from "@/components/ui/text";
import { colors, gaps, getColor, semanticColors } from "@/constants/theme";
import { initializeDatabase } from "@/lib/sqlite/init";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { type PropsWithChildren } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export function DatabaseInitializationGate({ children }: PropsWithChildren) {
  const databaseQuery = useQuery({
    queryKey: ["local-database-initialization"],
    queryFn: async () => {
      await initializeDatabase();
      return true;
    },
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  if (databaseQuery.isSuccess) {
    return children;
  }

  const failed = databaseQuery.isError;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
          contentFit="cover"
          accessibilityLabel="Wafflelog logo"
        />

        {!failed ? (
          <ActivityIndicator
            size="large"
            color={getColor(colors.purple)}
            style={styles.indicator}
          />
        ) : null}

        <TitleRegular
          size="xl"
          weight="700"
          color={colors.textDarkGrey}
          style={styles.title}
        >
          {failed ? "We couldn’t prepare Wafflelog" : "Preparing Wafflelog"}
        </TitleRegular>
        <UIText style={styles.message}>
          {failed
            ? "We couldn’t prepare local storage on this device. Try again to continue."
            : "We’re preparing secure local storage on this device."}
        </UIText>

        {failed ? (
          <View style={styles.retryButton}>
            <AuthSubmitButton
              label="Try again"
              pendingLabel="Trying again..."
              isPending={databaseQuery.isFetching}
              onPress={() => {
                void databaseQuery.refetch();
              }}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColors.screen,
    paddingHorizontal: gaps.xl,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 14,
    marginBottom: gaps.xl,
  },
  indicator: {
    marginBottom: gaps.lg,
  },
  title: {
    textAlign: "center",
  },
  message: {
    marginTop: gaps.sm,
    color: semanticColors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  retryButton: {
    width: "100%",
    marginTop: gaps.xl,
  },
});
