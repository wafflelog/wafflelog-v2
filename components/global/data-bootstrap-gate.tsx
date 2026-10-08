import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { TitleRegular } from "@/components/title/regular";
import { UIText } from "@/components/ui/text";
import { colors, gaps, getColor, semanticColors } from "@/constants/theme";
import { useDataSync } from "@/hook/use-data-sync";
import { Image } from "expo-image";
import { type PropsWithChildren } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function DataBootstrapGate({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const { bootstrapState, retryBootstrap } = useDataSync();

  if (bootstrapState.status === "ready") {
    return children;
  }

  const failed = bootstrapState.status === "failed";

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
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
          {failed ? "We couldn’t load your trips" : "Getting your trips ready"}
        </TitleRegular>
        <UIText style={styles.message}>
          {failed
            ? "We couldn’t finish the one-time setup. Check your connection and try again."
            : "This one-time setup happens when you first sign in on a device. We’re bringing your trips here now."}
        </UIText>

        {failed ? (
          <View style={styles.retryButton}>
            <AuthSubmitButton
              label="Try again"
              pendingLabel="Trying again..."
              isPending={false}
              onPress={() => {
                void retryBootstrap().catch(() => undefined);
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
