import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { TitleRegular } from "@/components/title/regular";
import { UIText } from "@/components/ui/text";
import { colors, gaps, getColor, semanticColors } from "@/constants/theme";
import { useDataSync } from "@/hook/use-data-sync";
import { actionSignOutCurrentDevice } from "@/lib/auth/sign-out";
import { Image } from "expo-image";
import { LogOut as LogOutIcon } from "lucide-react-native";
import { type PropsWithChildren, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function DataBootstrapGate({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const { bootstrapState, retryBootstrap } = useDataSync();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setSignOutError(null);

    try {
      await actionSignOutCurrentDevice();
    } catch {
      setSignOutError(
        "We couldn’t sign you out. Check your connection and try again.",
      );
    } finally {
      setIsSigningOut(false);
    }
  };

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
          <View style={styles.actions}>
            <AuthSubmitButton
              label="Try again"
              pendingLabel="Trying again..."
              isPending={false}
              onPress={() => {
                void retryBootstrap().catch(() => undefined);
              }}
            />

            <Pressable
              accessibilityLabel="Sign out"
              accessibilityRole="button"
              accessibilityState={{
                busy: isSigningOut,
                disabled: isSigningOut,
              }}
              disabled={isSigningOut}
              onPress={() => void handleSignOut()}
              style={({ pressed }) => [
                styles.signOutButton,
                pressed && !isSigningOut && styles.signOutButtonPressed,
                isSigningOut && styles.signOutButtonDisabled,
              ]}
            >
              {isSigningOut ? (
                <ActivityIndicator size="small" color={getColor(colors.red)} />
              ) : (
                <LogOutIcon size={18} color={getColor(colors.red)} />
              )}
              <UIText style={styles.signOutText} weight="700">
                {isSigningOut ? "Signing out…" : "Sign out"}
              </UIText>
            </Pressable>

            {signOutError ? (
              <UIText style={styles.signOutError}>{signOutError}</UIText>
            ) : null}
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
  actions: {
    width: "100%",
    marginTop: gaps.xl,
    gap: gaps.sm,
  },
  signOutButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xs,
    paddingHorizontal: gaps.md,
  },
  signOutButtonPressed: {
    opacity: 0.7,
  },
  signOutButtonDisabled: {
    opacity: 0.6,
  },
  signOutText: {
    color: getColor(colors.red),
    fontSize: 14,
    lineHeight: 20,
  },
  signOutError: {
    color: getColor(colors.red),
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
});
